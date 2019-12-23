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

import Big from 'big.js';
import {Constraint} from '../../../../core/model/constraint';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../core/model/resource';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {groupDocumentsByCollection} from '../../../../core/store/documents/document.utils';
import {filterDocumentsAndLinksByStem} from '../../../../core/store/documents/documents.filters';
import {
  KanbanAttribute,
  KanbanColumn,
  KanbanConfig,
  KanbanResource,
  KanbanValueType,
} from '../../../../core/store/kanbans/kanban';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isArray, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {findOriginalAttributeConstraint} from './kanban.util';
import {generateId} from '../../../../shared/utils/resource.utils';

interface KanbanColumnData {
  resourcesOrder: KanbanResource[];
  attributes: KanbanAttribute[];
  constraintTypes: ConstraintType[];
  summary?: KanbanSummary;
}

interface KanbanSummary {
  values: any[];
  count: number;
  summary?: string;
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
    const {columnsMap, otherResourcesOrder, otherAggregator} = this.groupDocumentsByColumns(
      documentsByCollection,
      config,
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
      summary: otherAggregator.summary,
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
    otherResourcesOrder: KanbanResource[];
    otherAggregator: KanbanSummary;
  } {
    const stemsConfigs = (config && config.stemsConfigs) || [];
    const columnsMap: Record<string, KanbanColumnData> = {};
    const otherAggregator: KanbanSummary = {values: [], count: 0};
    const otherResourcesOrder: KanbanResource[] = [];
    let stemIndex = -1;
    for (const stemConfig of stemsConfigs) {
      stemIndex++;

      const collection =
        stemConfig.attribute && (collections || []).find(coll => coll.id === stemConfig.attribute.resourceId);
      const attribute = collection && findAttribute(collection.attributes, stemConfig.attribute.attributeId);
      if (!attribute) {
        continue;
      }

      const {pipelineDocuments} = filterDocumentsAndLinksByStem(
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

              this.aggregateValue(columnData.summary, document, config);

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
              const summary: KanbanSummary = {values: [], count: 0};

              this.aggregateValue(summary, document, config);

              columnsMap[stringValue] = {
                resourcesOrder: [resourceOrder],
                attributes: [createdByAttribute],
                constraintTypes,
                summary,
              };
            }
          } else {
            otherResourcesOrder.push({id: document.id, resourceType: AttributesResourceType.Collection, stemIndex});
            this.aggregateValue(otherAggregator, document, config);
          }
        }
      }
    }

    if (config && config.aggregation && config.aggregation.valueType === KanbanValueType.AllPercentage) {
      this.computeRelativeValue(columnsMap, config, otherAggregator, collections, linkTypes);
    } else {
      this.injectSummaries(columnsMap, config, otherAggregator, collections, linkTypes);
    }

    return {columnsMap, otherResourcesOrder, otherAggregator};
  }

  private aggregateValue(summary: KanbanSummary, document: DocumentModel, config: KanbanConfig) {
    if (config && config.aggregation && document) {
      if (config.aggregation.resourceId === document.collectionId) {
        const value = document.data[config.aggregation.attributeId];
        summary.values.push(value);
        summary.count++;
      }
    }
  }

  private injectSummaries(
    columnsMap: Record<string, KanbanColumnData>,
    config: KanbanConfig,
    otherAggregator: KanbanSummary,
    collections: Collection[],
    linkTypes: LinkType[]
  ) {
    if (config && config.aggregation) {
      Object.keys(columnsMap).forEach(key => {
        if (columnsMap[key].summary) {
          columnsMap[key].summary.summary = this.formatAggregatedValue(
            columnsMap[key].summary,
            config,
            collections,
            linkTypes
          );
        }
      });

      if (otherAggregator) {
        otherAggregator.summary = this.formatAggregatedValue(otherAggregator, config, collections, linkTypes);
      }
    }
  }

  private computeRelativeValue(
    columnsMap: Record<string, KanbanColumnData>,
    config: KanbanConfig,
    otherAggregator: KanbanSummary,
    collections: Collection[],
    linkTypes: LinkType[]
  ) {
    const values: Record<string, number> = {};
    let otherValue = 0;
    let total = 0;

    Object.keys(columnsMap).forEach(key => {
      if (columnsMap[key].summary) {
        values[key] =
          +aggregateDataValues(
            config.aggregation.aggregation,
            columnsMap[key].summary.values,
            findOriginalAttributeConstraint(config.aggregation, collections, linkTypes)
          ) || 0;

        total += values[key];
      }
    });

    if (otherAggregator) {
      otherValue =
        +aggregateDataValues(
          config.aggregation.aggregation,
          otherAggregator.values,
          findOriginalAttributeConstraint(config.aggregation, collections, linkTypes)
        ) || 0;

      total += otherValue;

      otherAggregator.summary = new Big((otherValue / total) * 100).toFixed(2) + '%';
    }

    Object.keys(columnsMap).forEach(key => {
      if (columnsMap[key].summary) {
        columnsMap[key].summary.summary = new Big((values[key] / total) * 100).toFixed(2) + '%';
      }
    });
  }

  private formatAggregatedValue(
    aggregator: KanbanSummary,
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[]
  ): any {
    const constraint = findOriginalAttributeConstraint(config.aggregation, collections, linkTypes);

    const value = aggregateDataValues(config.aggregation.aggregation, aggregator.values, constraint);

    if ([DataAggregationType.Count, DataAggregationType.Unique].includes(config.aggregation.aggregation)) {
      return value;
    }

    return (constraint || new UnknownConstraint()).createDataValue(value).format();
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
      const {resourcesOrder = null, attributes = null, constraintTypes = null, summary = null} =
        columnsMap[title] || {};
      const newResourcesOrder = sortDocumentsIdsByPreviousOrder(resourcesOrder, currentColumn.resourcesOrder);

      if (isColumnValid(resourcesOrder, title, currentColumn.createdFromAttributes, collections)) {
        newColumns.push({
          id: getColumnIdOrGenerate(currentColumn),
          title,
          width: currentColumn.width,
          resourcesOrder: newResourcesOrder,
          createdFromAttributes: attributes || currentColumn.createdFromAttributes,
          constraintType: mergeConstraintType(currentColumn.constraintType, constraintTypes),
          summary: summary && summary.summary,
        });
        newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
      }
    }
  }

  for (const title of newColumnsTitles) {
    const {resourcesOrder, attributes, constraintTypes, summary} = columnsMap[title];
    newColumns.push({
      id: generateId(),
      title,
      width: COLUMN_WIDTH,
      resourcesOrder,
      createdFromAttributes: attributes,
      constraintType: constraintTypes.length === 1 ? constraintTypes[0] : null,
      summary: summary && summary.summary,
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
    if (!attribute.constraint.createDataValue(title).isValid()) {
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
      newOrderedResources.push(resourcesOrderMap[order.id]);
      delete resourcesOrderMap[order.id];
    }
  }

  Object.values(resourcesOrderMap).forEach(order => newOrderedResources.push(order));

  return newOrderedResources;
}
