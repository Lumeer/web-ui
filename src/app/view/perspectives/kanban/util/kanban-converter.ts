/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {SelectConstraintConfig} from '../../../../core/model/data/constraint-config';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {
  KanbanAttribute,
  KanbanCollectionConfig,
  KanbanColumn,
  KanbanConfig,
} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {Constraint, ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {generateId} from '../../../../shared/utils/resource.utils';
import {deepObjectsEquals, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {formatDataValue, isSelectDataValueValid} from '../../../../shared/utils/data.utils';

interface KanbanColumnData {
  documentsIds: string[];
  attributes: KanbanAttribute[];
  constraintTypes: ConstraintType[];
}

const COLUMN_WIDTH = 300;

export class KanbanConverter {
  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {}

  public buildKanbanConfig(
    config: KanbanConfig,
    documents: DocumentModel[],
    collections: Collection[],
    constraintData?: ConstraintData
  ): KanbanConfig {
    const documentsByCollection = groupDocumentsByCollection(documents);
    const {columnsMap, otherDocumentsIds} = this.groupDocumentsByColumns(
      documentsByCollection,
      (config && config.collections) || {},
      collections,
      constraintData
    );

    const columns = createKanbanColumns(config, columnsMap);
    const otherColumn = {
      id: getColumnIdOrGenerate(config && config.otherColumn),
      width: COLUMN_WIDTH,
      documentsIdsOrder: otherDocumentsIds,
    };
    return {...config, columns, otherColumn};
  }

  private groupDocumentsByColumns(
    documentsByCollection: Record<string, DocumentModel[]>,
    collectionsConfig: Record<string, KanbanCollectionConfig>,
    collections: Collection[],
    constraintData?: ConstraintData
  ): {columnsMap: Record<string, KanbanColumnData>; otherDocumentsIds: string[]} {
    const columnsMap: Record<string, KanbanColumnData> = {};
    const otherDocumentsIds = [];
    for (const collection of collections || []) {
      const collectionConfig = collectionsConfig[collection.id];
      const kanbanAttribute = collectionConfig && collectionConfig.attribute && collectionConfig.attribute;
      const attribute =
        kanbanAttribute && (collection.attributes || []).find(attr => attr.id === kanbanAttribute.attributeId);
      const documents = documentsByCollection[collection.id] || [];
      if (attribute) {
        for (const document of documents) {
          const value = document.data[attribute.id];
          const formattedValue = this.formatKanbanColumnValue(
            value,
            attribute.constraint,
            constraintData,
            kanbanAttribute
          );
          if (isNotNullOrUndefined(formattedValue) && formattedValue !== '') {
            const createdByAttribute = {collectionId: collection.id, attributeId: attribute.id};
            const stringValue = formattedValue.toString();

            if (columnsMap[stringValue]) {
              const columnData = columnsMap[stringValue];
              columnData.documentsIds.push(document.id);
              if (!kanbanAttributesIncludesAttribute(columnData.attributes, createdByAttribute)) {
                columnData.attributes.push(createdByAttribute);
              }
              if (
                attribute &&
                attribute.constraint &&
                !columnData.constraintTypes.includes(attribute.constraint.type)
              ) {
                columnData.constraintTypes.push(attribute.constraint.type);
              }
            } else {
              const constraintTypes = (attribute.constraint && [attribute.constraint.type]) || [];
              columnsMap[stringValue] = {
                documentsIds: [document.id],
                attributes: [createdByAttribute],
                constraintTypes,
              };
            }
          } else {
            otherDocumentsIds.push(document.id);
          }
        }
      } else {
        otherDocumentsIds.push(...documents.map(document => document.id));
      }
    }

    return {columnsMap, otherDocumentsIds};
  }

  private formatKanbanColumnValue(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    kanbanAttribute: KanbanAttribute
  ): any {
    if (constraint) {
      if (constraint.type === ConstraintType.User) {
        return value;
      } else if (
        constraint.type === ConstraintType.Select &&
        !isSelectDataValueValid(value, constraint.config as SelectConstraintConfig)
      ) {
        return null;
      }
    }

    const overrideConstraint =
      kanbanAttribute &&
      kanbanAttribute.constraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(constraint, kanbanAttribute.constraint);

    return formatDataValue(value, overrideConstraint || constraint, constraintData);
  }
}

function createKanbanColumns(
  currentConfig: KanbanConfig,
  columnsMap: Record<string, KanbanColumnData>
): KanbanColumn[] {
  let newColumnsTitles = Object.keys(columnsMap);
  const selectedAttributes = Object.values(currentConfig.collections || {})
    .map(conf => conf.attribute)
    .filter(attribute => !!attribute);

  const newColumns: KanbanColumn[] = [];
  for (const currentColumn of currentConfig.columns || []) {
    const title = currentColumn.title;
    if (
      newColumnsTitles.includes(title) ||
      kanbanAttributesIntersect(currentColumn.createdFromAttributes, selectedAttributes)
    ) {
      const {documentsIds = null, attributes = null, constraintTypes = null} = columnsMap[title] || {};
      const documentsIdsOrder = sortDocumentsIdsByPreviousOrder(documentsIds, currentColumn.documentsIdsOrder);

      newColumns.push({
        id: getColumnIdOrGenerate(currentColumn),
        title,
        width: currentColumn.width,
        documentsIdsOrder,
        createdFromAttributes: attributes,
        constraintType: mergeConstraintType(currentColumn.constraintType, constraintTypes),
      });
      newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
    }
  }

  for (const title of newColumnsTitles) {
    const {documentsIds, attributes, constraintTypes} = columnsMap[title];
    newColumns.push({
      id: generateId(),
      title,
      width: COLUMN_WIDTH,
      documentsIdsOrder: documentsIds,
      createdFromAttributes: attributes,
      constraintType: constraintTypes.length === 1 ? constraintTypes[0] : null,
    });
  }

  return newColumns;
}

function getColumnIdOrGenerate(column: KanbanColumn): string {
  return (column && column.id) || generateId();
}

function groupDocumentsByCollection(documents: DocumentModel[]): Record<string, DocumentModel[]> {
  return (documents || []).reduce((map, doc) => {
    if (!map[doc.collectionId]) {
      map[doc.collectionId] = [];
    }
    map[doc.collectionId].push(doc);
    return map;
  }, {});
}

function mergeConstraintType(currentConstraint: ConstraintType, newConstrainTypes: ConstraintType[]): ConstraintType {
  if (currentConstraint) {
    if (newConstrainTypes && newConstrainTypes.length === 1 && newConstrainTypes[0] === currentConstraint) {
      return currentConstraint;
    }
  } else if (newConstrainTypes && newConstrainTypes.length === 1) {
    return newConstrainTypes[0];
  }

  return null;
}

function kanbanAttributesIntersect(
  previousAttributes: KanbanAttribute[],
  selectedAttributes: KanbanAttribute[]
): boolean {
  if (!selectedAttributes) {
    return false;
  }
  if (!previousAttributes || previousAttributes.length === 0) {
    return true;
  }
  return previousAttributes.some(attr => kanbanAttributesIncludesAttribute(selectedAttributes, attr));
}

function kanbanAttributesIncludesAttribute(attributes: KanbanAttribute[], attribute: KanbanAttribute): boolean {
  return attributes.some(attr => deepObjectsEquals(attr, attribute));
}

function sortDocumentsIdsByPreviousOrder(documentsIds: string[], orderedDocumentsIds: string[]): string[] {
  const newOrderedDocumentsIds = [];
  const documentsIdsSet = new Set(documentsIds || []);

  for (const documentId of orderedDocumentsIds || []) {
    if (documentsIdsSet.has(documentId)) {
      newOrderedDocumentsIds.push(documentId);
      documentsIdsSet.delete(documentId);
    }
  }

  documentsIdsSet.forEach(documentId => newOrderedDocumentsIds.push(documentId));

  return newOrderedDocumentsIds;
}
