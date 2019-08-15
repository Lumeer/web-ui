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
  KanbanColumn,
  KanbanConfig,
  KanbanResource,
  KanbanStemConfig,
} from '../../../../core/store/kanbans/kanban';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {Constraint, ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {generateId} from '../../../../shared/utils/resource.utils';
import {deepObjectsEquals, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {formatDataValue, isSelectDataValueValid} from '../../../../shared/utils/data.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {filterDocumentsByStem} from '../../../../core/store/documents/documents.filters';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {AttributesResourceType} from '../../../../core/model/resource';
import {groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';

interface KanbanColumnData {
  resourcesOrder: KanbanResource[];
  attributes: KanbanAttribute[];
  constraintTypes: ConstraintType[];
}

const COLUMN_WIDTH = 300;

export class KanbanConverter {
  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {}

  public buildKanbanConfig(
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    documents: DocumentModel[],
    linkInstances: LinkInstance[],
    constraintData?: ConstraintData
  ): KanbanConfig {
    const documentsByCollection = groupDocumentsByCollection(documents);
    const {columnsMap, otherResourcesOrder} = this.groupDocumentsByColumns(
      documentsByCollection,
      (config && config.stemsConfigs) || [],
      collections,
      linkTypes,
      linkInstances,
      constraintData
    );

    const columns = createKanbanColumns(config, columnsMap, collections);
    const otherColumn = {
      id: getColumnIdOrGenerate(config && config.otherColumn),
      width: COLUMN_WIDTH,
      resourcesOrder: otherResourcesOrder,
    };
    return {...config, columns, otherColumn};
  }

  private groupDocumentsByColumns(
    documentsByCollection: Record<string, DocumentModel[]>,
    stemsConfigs: KanbanStemConfig[],
    collections: Collection[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ): {columnsMap: Record<string, KanbanColumnData>; otherResourcesOrder: KanbanResource[]} {
    const columnsMap: Record<string, KanbanColumnData> = {};
    const otherResourcesOrder: KanbanResource[] = [];
    for (const stemConfig of stemsConfigs) {
      const collection =
        stemConfig.attribute && (collections || []).find(coll => coll.id === stemConfig.attribute.resourceId);
      const attribute = collection && findAttribute(collection.attributes, stemConfig.attribute.attributeId);
      if (!attribute) {
        continue;
      }

      const {pipelineDocuments} = filterDocumentsByStem(
        documentsByCollection,
        collections,
        linkTypes,
        linkInstances,
        stemConfig.stem,
        []
      );
      const pipelineIndex = stemConfig.attribute.resourceIndex / 2; // resourceIndex counts both collection and linkType and pipeline only collection
      const documents = pipelineDocuments[pipelineIndex] || [];
      for (const document of documents) {
        const value = document.data[attribute.id];
        const formattedValue = this.formatKanbanColumnValue(
          value,
          attribute.constraint,
          constraintData,
          stemConfig.attribute
        );
        if (isNotNullOrUndefined(formattedValue) && String(formattedValue).trim() !== '') {
          const createdByAttribute = {...stemConfig.attribute};
          const stringValue = formattedValue.toString();

          const resourceOrder = {
            id: document.id,
            attributeId: attribute.id,
            resourceType: AttributesResourceType.Collection,
          };
          if (columnsMap[stringValue]) {
            const columnData = columnsMap[stringValue];
            if (!columnData.resourcesOrder.find(order => order.id === resourceOrder.id)) {
              columnData.resourcesOrder.push(resourceOrder);
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
            }
          } else {
            const constraintTypes = (attribute.constraint && [attribute.constraint.type]) || [];
            columnsMap[stringValue] = {
              resourcesOrder: [resourceOrder],
              attributes: [createdByAttribute],
              constraintTypes,
            };
          }
        } else {
          otherResourcesOrder.push({id: document.id, resourceType: AttributesResourceType.Collection});
        }
      }
    }

    return {columnsMap, otherResourcesOrder};
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
  columnsMap: Record<string, KanbanColumnData>,
  collections: Collection[]
): KanbanColumn[] {
  let newColumnsTitles = Object.keys(columnsMap);
  const selectedAttributes = (currentConfig.stemsConfigs || [])
    .map(conf => conf.attribute)
    .filter(attribute => !!attribute);

  const newColumns: KanbanColumn[] = [];
  for (const currentColumn of currentConfig.columns || []) {
    const title = currentColumn.title;
    if (
      newColumnsTitles.includes(title) ||
      kanbanAttributesIntersect(currentColumn.createdFromAttributes, selectedAttributes)
    ) {
      const {resourcesOrder = null, attributes = null, constraintTypes = null} = columnsMap[title] || {};
      const newResourcesOrder = sortDocumentsIdsByPreviousOrder(resourcesOrder, currentColumn.resourcesOrder);

      if (isColumnValid(resourcesOrder, title, currentColumn.createdFromAttributes, collections)) {
        newColumns.push({
          id: getColumnIdOrGenerate(currentColumn),
          title,
          width: currentColumn.width,
          resourcesOrder: newResourcesOrder,
          createdFromAttributes: attributes || currentColumn.createdFromAttributes,
          constraintType: mergeConstraintType(currentColumn.constraintType, constraintTypes),
        });
        newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
      }
    }
  }

  for (const title of newColumnsTitles) {
    const {resourcesOrder, attributes, constraintTypes} = columnsMap[title];
    newColumns.push({
      id: generateId(),
      title,
      width: COLUMN_WIDTH,
      resourcesOrder,
      createdFromAttributes: attributes,
      constraintType: constraintTypes.length === 1 ? constraintTypes[0] : null,
    });
  }

  return newColumns;
}

function isColumnValid(
  resourcesOrder: KanbanResource[],
  title: string,
  attributes: KanbanAttribute[],
  collections: Collection[]
): boolean {
  if ((resourcesOrder || []).length > 0) {
    return true;
  }

  if ((attributes || []).every(attribute => selectedAttributeIsInvalid(title, attribute, collections))) {
    return false;
  }

  return true;
}

function selectedAttributeIsInvalid(
  title: string,
  kanbanAttribute: KanbanAttribute,
  collections: Collection[]
): boolean {
  const attribute = findAttributeByKanbanAttribute(kanbanAttribute, collections);
  if (!attribute) {
    return true;
  }

  if (attribute.constraint && attribute.constraint.type === ConstraintType.Select) {
    const config = attribute.constraint.config as SelectConstraintConfig;
    if (!isSelectDataValueValid(title, config)) {
      return true;
    }
  }

  return false;
}

function findAttributeByKanbanAttribute(kanbanAttribute: KanbanAttribute, collections: Collection[]): Attribute {
  const collection = (collections || []).find(coll => coll.id === kanbanAttribute.resourceId);
  return findAttribute(collection && collection.attributes, kanbanAttribute.attributeId);
}

function getColumnIdOrGenerate(column: KanbanColumn): string {
  return (column && column.id) || generateId();
}

function mergeConstraintType(currentConstraint: ConstraintType, newConstrainTypes: ConstraintType[]): ConstraintType {
  if (currentConstraint) {
    if (!newConstrainTypes || (newConstrainTypes.length === 1 && newConstrainTypes[0] === currentConstraint)) {
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

function sortDocumentsIdsByPreviousOrder(
  resourcesOrder: KanbanResource[],
  orderedResourcesOrder: KanbanResource[]
): KanbanResource[] {
  const newOrderedResources: KanbanResource[] = [];
  const resourcesOrderMap: Record<string, KanbanResource> = (resourcesOrder || []).reduce(
    (map, order) => ({...map, [order.id]: order}),
    {}
  );

  for (const order of orderedResourcesOrder || []) {
    if (resourcesOrderMap[order.id]) {
      newOrderedResources.push(order);
      delete resourcesOrderMap[order.id];
    }
  }

  Object.values(resourcesOrderMap).forEach(order => newOrderedResources.push(order));

  return newOrderedResources;
}
