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
import {AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {KanbanAttribute, KanbanColumn, KanbanConfig, KanbanDataResource} from '../../../../core/store/kanbans/kanban';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {generateId} from '../../../../shared/utils/resource.utils';
import {SizeType} from '../../../../shared/slider/size/size-type';
import {
  findAttributeByQueryAttribute,
  findConstraintByQueryAttribute,
  findResourceByQueryResource,
} from '../../../../core/model/query-attribute';
import {SelectConstraint} from '../../../../core/model/constraint/select.constraint';
import {
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../shared/utils/data/data-aggregator';
import {cleanKanbanAttribute} from './kanban.util';
import {DataValue} from '../../../../core/model/data-value';

interface KanbanColumnData {
  resourcesOrder: KanbanDataResource[];
  attributes: KanbanAttribute[];
  constraintTypes: ConstraintType[];
}

const COLUMN_WIDTH = 300;

export class KanbanConverter {
  private dataAggregator: DataAggregator;

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatKanbanValue(value, constraint, data, aggregatorAttribute)
    );
  }

  public buildKanbanConfig(
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    documents: DocumentModel[],
    linkInstances: LinkInstance[],
    constraintData?: ConstraintData
  ): KanbanConfig {
    const {columnsMap, otherResourcesOrder} = this.groupDataByColumns(
      config,
      collections,
      documents,
      linkTypes,
      linkInstances,
      constraintData
    );

    const columns = createKanbanColumns(config, columnsMap, collections, linkTypes);
    const otherColumn = {
      id: getColumnIdOrGenerate(config?.otherColumn),
      width: getColumnSizeTypeWidth(config?.columnSize),
      resourcesOrder: otherResourcesOrder,
    };
    return {...config, columns, otherColumn};
  }

  private groupDataByColumns(
    config: KanbanConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ): {
    columnsMap: Record<string, KanbanColumnData>;
    otherResourcesOrder: KanbanDataResource[];
  } {
    const stemsConfigs = config?.stemsConfigs || [];
    const columnsMap: Record<string, KanbanColumnData> = this.createInitialColumnsMap(config, collections, linkTypes);
    const otherResourcesOrder: KanbanDataResource[] = [];

    for (let stemIndex = 0; stemIndex < stemsConfigs.length; stemIndex++) {
      const stemConfig = stemsConfigs[stemIndex];
      const attribute = findAttributeByQueryAttribute(stemConfig.attribute, collections, linkTypes);
      if (!attribute) {
        continue;
      }

      this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, stemConfig.stem, constraintData);
      const rowAttribute: DataAggregatorAttribute = {
        resourceIndex: stemConfig.attribute.resourceIndex,
        attributeId: attribute.id,
        data: stemConfig.attribute.constraint,
      };

      const resource = findResourceByQueryResource(stemConfig.resource, collections, linkTypes);
      const valueAttribute: DataAggregatorAttribute = resource
        ? {
            resourceIndex: stemConfig.resource.resourceIndex,
            attributeId: resource.attributes?.[0]?.id,
          }
        : rowAttribute;

      const resourceType = resource ? stemConfig.resource.resourceType : stemConfig.attribute.resourceType;

      const aggregatedMapData = this.dataAggregator.aggregate([rowAttribute], [], [valueAttribute]);

      for (const formattedValue of Object.keys(aggregatedMapData.map)) {
        const aggregatedDataValues: AggregatedDataValues[] = aggregatedMapData.map[formattedValue];
        const dataResources = aggregatedDataValues?.[0]?.objects || [];

        if (isNotNullOrUndefined(formattedValue) && String(formattedValue).trim() !== '') {
          const createdByAttribute = cleanKanbanAttribute(stemConfig.attribute);
          const stringValue = formattedValue.toString();

          if (columnsMap[stringValue]) {
            const columnData = columnsMap[stringValue];

            this.addDataResources(columnData, dataResources, resourceType, stemConfig.attribute.attributeId, stemIndex);

            if (!kanbanAttributesIncludesAttribute(columnData.attributes, createdByAttribute)) {
              columnData.attributes.push(createdByAttribute);
            }
            if (attribute?.constraint && !columnData.constraintTypes.includes(attribute.constraint.type)) {
              columnData.constraintTypes.push(attribute.constraint.type);
            }
          } else {
            const constraintTypes = attribute?.constraint ? [attribute.constraint.type] : [];

            columnsMap[stringValue] = {
              resourcesOrder: [],
              attributes: [createdByAttribute],
              constraintTypes,
            };

            this.addDataResources(
              columnsMap[stringValue],
              dataResources,
              resourceType,
              stemConfig.attribute.attributeId,
              stemIndex
            );
          }
        } else {
          otherResourcesOrder.push(
            ...dataResources.map(dataResource => ({
              id: dataResource.id,
              resourceType,
              stemIndex,
            }))
          );
        }
      }
    }

    return {columnsMap, otherResourcesOrder};
  }

  private addDataResources(
    data: KanbanColumnData,
    dataResources: DataResource[],
    resourceType: AttributesResourceType,
    attributeId: string,
    stemIndex: number
  ) {
    for (const dataResource of dataResources) {
      if (!data.resourcesOrder.some(order => order.id === dataResource.id && order.resourceType === resourceType)) {
        data.resourcesOrder.push({id: dataResource.id, resourceType, stemIndex, attributeId});
      }
    }
  }

  private createInitialColumnsMap(
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[]
  ): Record<string, KanbanColumnData> {
    const columnsLength = config?.columns?.length || 0;
    const firstAttribute = config?.stemsConfigs?.[0]?.attribute;
    if (columnsLength === 0 && firstAttribute) {
      const constraint = findConstraintByQueryAttribute(firstAttribute, collections, linkTypes);
      if (constraint?.type === ConstraintType.Select) {
        const values = (<SelectConstraint>constraint).config?.options?.map(option => option.value) || [];
        return values
          .filter(value => isNotNullOrUndefined(value))
          .reduce(
            (map, value) => ({
              ...map,
              [value]: {resourcesOrder: [], attributes: [firstAttribute], constraintTypes: [ConstraintType.Select]},
            }),
            {}
          );
      }
    }

    return {};
  }

  private formatKanbanValue(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ): any {
    const kanbanConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint =
      kanbanConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, kanbanConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    return this.formatDataValue(finalConstraint.createDataValue(value, constraintData), finalConstraint);
  }

  private formatDataValue(dataValue: DataValue, constraint: Constraint): any {
    switch (constraint.type) {
      case ConstraintType.User:
      case ConstraintType.Select:
        return dataValue.serialize();
      default:
        return dataValue.format();
    }
  }
}

function createKanbanColumns(
  currentConfig: KanbanConfig,
  columnsMap: Record<string, KanbanColumnData>,
  collections: Collection[],
  linkTypes: LinkType[]
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

      if (isColumnValid(resourcesOrder, title, currentColumn.createdFromAttributes, collections, linkTypes)) {
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
  collections: Collection[],
  linkTypes: LinkType[]
): boolean {
  if ((resourcesOrder || []).length > 0) {
    return true;
  }

  if ((attributes || []).every(attribute => selectedAttributeIsInvalid(title, attribute, collections, linkTypes))) {
    return false;
  }

  return true;
}

function selectedAttributeIsInvalid(
  title: string,
  kanbanAttribute: KanbanAttribute,
  collections: Collection[],
  linkTypes: LinkType[]
): boolean {
  const attribute = findAttributeByQueryAttribute(kanbanAttribute, collections, linkTypes);
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
