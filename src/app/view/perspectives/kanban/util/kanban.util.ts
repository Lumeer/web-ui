/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {
  KanbanAttribute,
  KanbanCollectionConfig,
  KanbanColumn,
  KanbanConfig,
} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {formatDataValue} from '../../../../shared/utils/data.utils';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {deepObjectsEquals, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {generateId} from '../../../../shared/utils/resource.utils';
import {areArraysSame} from '../../../../shared/utils/array.utils';

const COLUMN_WIDTH = 300;

export function buildKanbanConfig(
  config: KanbanConfig,
  documents: DocumentModel[],
  collections: Collection[],
  constraintData?: ConstraintData
): KanbanConfig {
  const documentsByCollection = groupDocumentsByCollection(documents);
  const {columnsMap, otherDocumentsIds} = groupDocumentsByColumns(
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

function groupDocumentsByColumns(
  documentsByCollection: Record<string, DocumentModel[]>,
  collectionsConfig: Record<string, KanbanCollectionConfig>,
  collections: Collection[],
  constraintData?: ConstraintData
): {columnsMap: Record<string, {documentsIds: string[]; attributes: KanbanAttribute[]}>; otherDocumentsIds: string[]} {
  const columnsMap: Record<string, {documentsIds: string[]; attributes: KanbanAttribute[]}> = {};
  const otherDocumentsIds = [];
  for (const collection of collections || []) {
    const collectionConfig = collectionsConfig[collection.id];
    const selectedAttributeId =
      collectionConfig && collectionConfig.attribute && collectionConfig.attribute.attributeId;
    const attribute = (collection.attributes || []).find(attr => attr.id === selectedAttributeId);
    const documents = documentsByCollection[collection.id] || [];
    if (attribute) {
      for (const document of documents) {
        const value = document.data[attribute.id];
        const formattedValue = formatDataValue(value, attribute.constraint, constraintData);
        if (isNotNullOrUndefined(formattedValue) && formattedValue !== '') {
          const createdByAttribute = {collectionId: collection.id, attributeId: attribute.id};
          const stringValue = formattedValue.toString();

          if (columnsMap[stringValue]) {
            const columnData = columnsMap[stringValue];
            columnData.documentsIds.push(document.id);
            if (!kanbanAttributesContainAttribute(columnData.attributes, createdByAttribute)) {
              columnData.attributes.push(createdByAttribute);
            }
          } else {
            columnsMap[stringValue] = {documentsIds: [document.id], attributes: [createdByAttribute]};
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

function kanbanAttributesContainAttribute(attributes: KanbanAttribute[], attribute: KanbanAttribute): boolean {
  return attributes.some(attr => deepObjectsEquals(attr, attribute));
}

function createKanbanColumns(
  currentConfig: KanbanConfig,
  columnsMap: Record<string, {documentsIds: string[]; attributes: KanbanAttribute[]}>
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
      const {documentsIds = null, attributes = null} = columnsMap[title] || {};
      const documentsIdsOrder = sortDocumentsIdsByPreviousOrder(documentsIds, currentColumn.documentsIdsOrder);

      newColumns.push({
        id: getColumnIdOrGenerate(currentColumn),
        title,
        width: currentColumn.width,
        documentsIdsOrder,
        createdFromAttributes: attributes,
      });
      newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
    }
  }

  for (const title of newColumnsTitles) {
    const {documentsIds, attributes} = columnsMap[title];
    newColumns.push({
      id: generateId(),
      title,
      width: COLUMN_WIDTH,
      documentsIdsOrder: documentsIds,
      createdFromAttributes: attributes,
    });
  }

  return newColumns;
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
  return previousAttributes.some(attr => kanbanAttributesContainAttribute(selectedAttributes, attr));
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

export function isKanbanConfigChanged(viewConfig: KanbanConfig, currentConfig: KanbanConfig): boolean {
  if (!deepObjectsEquals(viewConfig.collections, currentConfig.collections)) {
    return true;
  }

  const currentColumns = currentConfig.columns || [];
  return (viewConfig.columns || []).some((column, index) => {
    if (index > currentColumns.length - 1) {
      return true;
    }

    const currentColumn = (currentConfig.columns || [])[index];
    return kanbanColumnsChanged(column, currentColumn);
  });
}

function kanbanColumnsChanged(column1: KanbanColumn, column2: KanbanColumn): boolean {
  return (
    !deepObjectsEquals(column1, column2) ||
    !areArraysSame(column1 && column1.documentsIdsOrder, column2 && column2.documentsIdsOrder)
  );
}
