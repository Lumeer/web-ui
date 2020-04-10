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

import {Constraint} from '../../../../core/model/constraint';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../core/model/resource';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';
import {filterDocumentsAndLinksByStem} from '../../../../core/store/documents/documents.filters';
import {KanbanAttribute, KanbanColumn, KanbanConfig, KanbanDataResource} from '../../../../core/store/kanbans/kanban';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isArray, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {findOriginalAttributeConstraint} from './kanban.util';
import {generateId} from '../../../../shared/utils/resource.utils';
import {groupLinkInstancesByLinkTypes} from '../../../../core/store/link-instances/link-instance.utils';
import {SizeType} from '../../../../shared/slider/size/size-type';

interface KanbanColumnData {
  resourcesOrder: KanbanDataResource[];
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
      config,
      collections,
      linkTypes,
      linkInstances,
      constraintData
    );

    const columns = createKanbanColumns(config, columnsMap, collections);
    const otherColumn = {
      id: getColumnIdOrGenerate(config?.otherColumn),
      width: getColumnSizeTypeWidth(config?.columnSize),
      resourcesOrder: otherResourcesOrder,
    };
    return {...config, columns, otherColumn};
  }

  private groupDocumentsByColumns(
    documentsByCollection: Record<string, DocumentModel[]>,
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ): {
    columnsMap: Record<string, KanbanColumnData>;
    otherResourcesOrder: KanbanDataResource[];
  } {
    const stemsConfigs = (config && config.stemsConfigs) || [];
    const columnsMap: Record<string, KanbanColumnData> = {};
    const otherResourcesOrder: KanbanDataResource[] = [];
    let stemIndex = -1;
    for (const stemConfig of stemsConfigs) {
      stemIndex++;

      const attribute = findAttributeByKanbanAttribute(stemConfig.attribute, collections);
      if (!attribute) {
        continue;
      }

      const {pipelineDocuments} = filterDocumentsAndLinksByStem(
        collections,
        documentsByCollection,
        linkTypes,
        groupLinkInstancesByLinkTypes(linkInstances),
        constraintData,
        stemConfig.stem
      );
      const pipelineIndex = stemConfig.attribute.resourceIndex / 2; // resourceIndex counts both collection and linkType and pipeline only collection
      const documents = pipelineDocuments[pipelineIndex] || [];
      for (const document of documents) {
        const value = document.data[attribute.id];
        const formattedValues = this.formatKanbanColumnValues(
          value,
          attribute.constraint,
          constraintData,
          stemConfig.attribute,
          collections,
          linkTypes
        );

        for (const formattedValue of formattedValues) {
          if (isNotNullOrUndefined(formattedValue) && String(formattedValue).trim() !== '') {
            const createdByAttribute = {...stemConfig.attribute};
            const stringValue = formattedValue.toString();

            const resourceOrder = {
              id: document.id,
              attributeId: attribute.id,
              resourceType: AttributesResourceType.Collection,
              stemIndex,
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
            otherResourcesOrder.push({id: document.id, resourceType: AttributesResourceType.Collection, stemIndex});
          }
        }
      }
    }

    return {columnsMap, otherResourcesOrder};
  }

  private formatKanbanColumnValues(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    kanbanAttribute: KanbanAttribute,
    collections: Collection[],
    linkTypes: LinkType[]
  ): any[] {
    if (constraint) {
      if (constraint.type === ConstraintType.User || constraint.type === ConstraintType.Select) {
        return (isArray(value) ? value : [value]).map(val =>
          constraint.createDataValue(val, constraintData).isValid() ? val : null
        );
      }
    }

    const kanbanAttributeConstraint = findOriginalAttributeConstraint(kanbanAttribute, collections, linkTypes);
    const overrideConstraint =
      kanbanAttribute &&
      kanbanAttributeConstraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(constraint, kanbanAttributeConstraint);

    return [
      (overrideConstraint || constraint || new UnknownConstraint()).createDataValue(value, constraintData).format(),
    ];
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
          width: getColumnSizeTypeWidth(currentConfig.columnSize),
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
      width: getColumnSizeTypeWidth(currentConfig.columnSize),
      resourcesOrder,
      createdFromAttributes: attributes,
      constraintType: constraintTypes.length === 1 ? constraintTypes[0] : null,
    });
  }

  return newColumns;
}

function isColumnValid(
  resourcesOrder: KanbanDataResource[],
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
    if (!attribute.constraint.createDataValue(title).isValid()) {
      return true;
    }
  }

  return false;
}

function findAttributeByKanbanAttribute(kanbanAttribute: KanbanAttribute, collections: Collection[]): Attribute {
  const collection = kanbanAttribute && (collections || []).find(coll => coll.id === kanbanAttribute.resourceId);
  return kanbanAttribute && findAttribute(collection && collection.attributes, kanbanAttribute.attributeId);
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
  resourcesOrder: KanbanDataResource[],
  orderedResourcesOrder: KanbanDataResource[]
): KanbanDataResource[] {
  const newOrderedResources: KanbanDataResource[] = [];
  const resourcesOrderMap: Record<string, KanbanDataResource> = (resourcesOrder || []).reduce(
    (map, order) => ({...map, [order.id]: order}),
    {}
  );

  for (const order of orderedResourcesOrder || []) {
    if (resourcesOrderMap[order.id]) {
      newOrderedResources.push(resourcesOrderMap[order.id]);
      delete resourcesOrderMap[order.id];
    }
  }

  Object.values(resourcesOrderMap).forEach(order => newOrderedResources.push(order));

  return newOrderedResources;
}

export function getColumnSizeTypeWidth(sizeType: SizeType): number {
  switch (sizeType) {
    case SizeType.S:
      return 200;
    case SizeType.M:
      return 300;
    case SizeType.L:
      return 400;
    case SizeType.XL:
      return 500;
    default:
      return COLUMN_WIDTH;
  }
}
