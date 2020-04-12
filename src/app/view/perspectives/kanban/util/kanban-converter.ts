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
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  KanbanAggregation,
  KanbanAttribute,
  KanbanColumn,
  KanbanConfig,
  KanbanResource,
  KanbanStemConfig,
  KanbanValueType,
} from '../../../../core/store/kanbans/kanban';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isNotNullOrUndefined, objectsByIdMap} from '../../../../shared/utils/common.utils';
import {generateId} from '../../../../shared/utils/resource.utils';
import {SizeType} from '../../../../shared/slider/size/size-type';
import {
  findAttributeByQueryAttribute,
  findConstraintByQueryAttribute,
  findResourceByQueryResource,
  queryAttributePermissions,
} from '../../../../core/model/query-attribute';
import {SelectConstraint} from '../../../../core/model/constraint/select.constraint';
import {
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../shared/utils/data/data-aggregator';
import {cleanKanbanAttribute, isKanbanAggregationDefined} from './kanban.util';
import {DataValue} from '../../../../core/model/data-value';
import {KanbanCard, KanbanData, KanbanDataColumn} from './kanban-data';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {DateTimeConstraintConfig} from '../../../../core/model/data/constraint-config';
import {parseDateTimeByConstraint} from '../../../../shared/utils/date.utils';
import * as moment from 'moment';
import {createDateTimeOptions} from '../../../../shared/date-time/date-time-options';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {convertToBig} from '../../../../shared/utils/data.utils';

interface AggregatedColumnData {
  count: number;
  values: any[];
  constraint?: Constraint;
}

const COLUMN_WIDTH = 300;

export class KanbanConverter {
  private dataAggregator: DataAggregator;
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];
  private constraintData: ConstraintData;

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatKanbanValue(value, constraint, data, aggregatorAttribute)
    );
  }

  public convert(
    config: KanbanConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    documents: DocumentModel[],
    linkInstances: LinkInstance[],
    permissions: Record<string, AllowedPermissions>,
    constraintData?: ConstraintData
  ): {config: KanbanConfig; data: KanbanData} {
    this.updateData(collections, linkTypes, documents, linkInstances, constraintData);
    const {columnsMap, otherColumn} = this.groupDataByColumns(config, permissions);

    const data = createKanbanData(config, columnsMap, otherColumn, collections, linkTypes);
    return {data, config: pickKanbanConfigFromData(config, data)};
  }

  private updateData(
    collections: Collection[],
    linkTypes: LinkType[],
    documents: DocumentModel[],
    linkInstances: LinkInstance[],
    constraintData?: ConstraintData
  ) {
    this.collections = collections;
    this.linkTypes = linkTypes;
    this.documents = documents;
    this.linkInstances = linkInstances;
    this.constraintData = constraintData;
  }

  private groupDataByColumns(
    config: KanbanConfig,
    permissions: Record<string, AllowedPermissions>
  ): {
    columnsMap: Record<string, Partial<KanbanDataColumn>>;
    otherColumn: Partial<KanbanDataColumn>;
  } {
    const stemsConfigs = config?.stemsConfigs || [];
    const columnsMap: Record<string, Partial<KanbanDataColumn>> = createInitialColumnsMap(
      config,
      this.collections,
      this.linkTypes
    );
    const otherColumn: Partial<KanbanDataColumn> = {cards: [], createdFromAttributes: []};
    const linkTypesMap = objectsByIdMap(this.linkTypes);
    const columnsAggregated: Record<string, AggregatedColumnData> = {};
    const otherAggregated: AggregatedColumnData = {count: 0, values: []};

    for (let stemIndex = 0; stemIndex < stemsConfigs.length; stemIndex++) {
      const stemConfig = stemsConfigs[stemIndex];
      const attribute = findAttributeByQueryAttribute(stemConfig.attribute, this.collections, this.linkTypes);
      if (!attribute) {
        continue;
      }

      const aggregationConstraint =
        stemConfig.aggregation &&
        findConstraintByQueryAttribute(stemConfig.aggregation, this.collections, this.linkTypes);

      this.dataAggregator.updateData(
        this.collections,
        this.documents,
        this.linkTypes,
        this.linkInstances,
        stemConfig.stem,
        this.constraintData
      );
      const rowAttribute: DataAggregatorAttribute = {
        resourceIndex: stemConfig.attribute.resourceIndex,
        attributeId: attribute.id,
        data: stemConfig.attribute.constraint,
        unique: true,
      };

      const valueAttribute: DataAggregatorAttribute = stemConfig.resource
        ? {
            resourceIndex: stemConfig.resource.resourceIndex,
            attributeId: null,
          }
        : {...rowAttribute, unique: false};

      const resource = createKanbanCardResource(
        stemConfig.resource || stemConfig.attribute,
        this.collections,
        this.linkTypes
      );
      const resourcePermissions = queryAttributePermissions(
        stemConfig.resource || stemConfig.attribute,
        permissions,
        linkTypesMap
      );
      const resourceType = stemConfig.resource?.resourceType || stemConfig.attribute.resourceType;

      const aggregatedData = this.dataAggregator.aggregateArray([rowAttribute], [valueAttribute]);

      for (const aggregatedDataItem of aggregatedData.items) {
        const aggregatedDataValues: AggregatedDataValues[] = aggregatedDataItem.values || [];
        const dataResources = aggregatedDataValues[0]?.objects || [];
        const dataResourcesChain = aggregatedDataItem.dataResourcesChains[0] || [];
        const title = aggregatedDataItem.value;

        if (isNotNullOrUndefined(title) && String(title).trim() !== '') {
          const createdByAttribute = cleanKanbanAttribute(stemConfig.attribute);
          const stringValue = title.toString();

          let columnData: Partial<KanbanDataColumn> = columnsMap[stringValue];
          if (!columnData) {
            columnData = {
              cards: [],
              createdFromAttributes: [],
              constraint: attribute?.constraint,
            };
            columnsMap[stringValue] = columnData;
          }

          columnData.constraint = columnData.constraint || attribute.constraint;
          if (!kanbanAttributesIncludesAttribute(columnData.createdFromAttributes, createdByAttribute)) {
            columnData.createdFromAttributes.push(createdByAttribute);
          }

          columnData.cards.push(
            ...dataResources.map(dataResource => ({
              dueHours: getDueHours(dataResource, resource, stemConfig),
              dataResource,
              resource,
              resourceType,
              stemIndex,
              permissions: resourcePermissions,
              dataResourcesChain,
            }))
          );
          if (stemConfig.aggregation) {
            if (!columnsAggregated[stringValue]) {
              columnsAggregated[stringValue] = {count: 0, values: [], constraint: null};
            }
            this.fillAggregatedMap(columnsAggregated[stringValue], dataResources, stemConfig);
            columnsAggregated[stringValue].constraint =
              columnsAggregated[stringValue].constraint || aggregationConstraint;
          }
        } else {
          otherColumn.cards.push(
            ...dataResources.map(dataResource => ({
              dueHours: getDueHours(dataResource, resource, stemConfig),
              dataResource,
              resource,
              resourceType,
              stemIndex,
              permissions: resourcePermissions,
              dataResourcesChain,
            }))
          );
          if (stemConfig.aggregation) {
            this.fillAggregatedMap(otherAggregated, dataResources, stemConfig);
            otherAggregated.constraint = otherAggregated.constraint || aggregationConstraint;
          }
        }
      }
    }
    if (isKanbanAggregationDefined(config)) {
      this.injectSummaries(config, columnsMap, otherColumn, columnsAggregated, otherAggregated);
    }
    return {columnsMap, otherColumn};
  }

  private injectSummaries(
    config: KanbanConfig,
    columnsMap: Record<string, Partial<KanbanDataColumn>>,
    otherColumn: Partial<KanbanDataColumn>,
    columnsAggregated: Record<string, AggregatedColumnData>,
    otherAggregated: AggregatedColumnData
  ) {
    if (config.aggregation?.valueType === KanbanValueType.AllPercentage) {
      const aggregationConstraint = findAggregationConstraint(config, this.collections, this.linkTypes);
      computeRelativeValue(config, columnsMap, otherColumn, columnsAggregated, otherAggregated, aggregationConstraint);
    } else {
      Object.keys(columnsAggregated).forEach(title => {
        const constraint = columnsAggregated[title].constraint || new UnknownConstraint();
        columnsMap[title].summary = formatAggregatedValue(
          columnsAggregated[title],
          config.aggregation,
          constraint,
          this.constraintData
        );
      });

      const otherConstraint = otherColumn.constraint || new UnknownConstraint();
      otherColumn.summary = formatAggregatedValue(
        otherAggregated,
        config.aggregation,
        otherConstraint,
        this.constraintData
      );
    }
  }

  private fillAggregatedMap(
    aggregated: AggregatedColumnData,
    dataResources: DataResource[],
    stemConfig: KanbanStemConfig
  ) {
    if (stemConfig?.aggregation) {
      dataResources.forEach(dataResource => {
        const value = dataResource?.data?.[stemConfig.aggregation.attributeId];
        if (isNotNullOrUndefined(value)) {
          aggregated.count++;
          aggregated.values.push(value);
        }
      });
    }
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

function findAggregationConstraint(config: KanbanConfig, collections: Collection[], linkTypes: LinkType[]): Constraint {
  for (const stemConfig of config?.stemsConfigs || []) {
    const constraint = findConstraintByQueryAttribute(stemConfig.aggregation, collections, linkTypes);
    if (constraint) {
      return constraint;
    }
  }

  return new UnknownConstraint();
}

function computeRelativeValue(
  config: KanbanConfig,
  columnsMap: Record<string, Partial<KanbanDataColumn>>,
  otherColumn: Partial<KanbanDataColumn>,
  columnsAggregated: Record<string, AggregatedColumnData>,
  otherAggregated: AggregatedColumnData,
  aggregationConstraint: Constraint
) {
  const values: Record<string, any> = {};
  let total = 0;

  Object.keys(columnsAggregated).forEach(key => {
    values[key] =
      aggregateDataValues(config.aggregation.aggregation, columnsAggregated[key].values, aggregationConstraint, true) ||
      0;
    total += values[key];
  });
  const otherValue =
    aggregateDataValues(config.aggregation.aggregation, otherAggregated.values, aggregationConstraint, true) || 0;
  total += otherValue;

  if (total > 0) {
    Object.keys(columnsAggregated).forEach(key => {
      columnsMap[key].summary = formatRelativeValue(values[key], total);
    });
    otherColumn.summary = formatRelativeValue(otherValue, total);
  }
}

function formatAggregatedValue(
  data: AggregatedColumnData,
  aggregation: KanbanAggregation,
  constraint: Constraint,
  constraintData: ConstraintData
): any {
  const value = aggregateDataValues(aggregation?.aggregation, data.values, constraint);

  if ([DataAggregationType.Count, DataAggregationType.Unique].includes(aggregation?.aggregation)) {
    return value;
  }

  return constraint.createDataValue(value, constraintData).format();
}

function formatRelativeValue(value: any, total: any) {
  const bigNumber = convertToBig((value / total) * 100);
  if (bigNumber) {
    return bigNumber.toFixed(2) + '%';
  }
  return null;
}

function createInitialColumnsMap(
  config: KanbanConfig,
  collections: Collection[],
  linkTypes: LinkType[]
): Record<string, Partial<KanbanDataColumn>> {
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
            [value]: {cards: [], createdFromAttributes: []},
          }),
          {}
        );
    }
  }

  return {};
}

function createKanbanCardResource(
  attribute: KanbanResource,
  collections: Collection[],
  linkTypes: LinkType[]
): AttributesResource {
  const resource = findResourceByQueryResource(attribute, collections, linkTypes);
  if (attribute?.resourceType === AttributesResourceType.LinkType) {
    const linkTypeCollections = (<LinkType>resource)?.collectionIds
      ?.map(id => (collections || []).find(coll => coll.id === id))
      ?.filter(collection => !!collection) as [Collection, Collection];
    return {...resource, collections: linkTypeCollections};
  }
  return resource;
}

function createKanbanData(
  currentConfig: KanbanConfig,
  columnsMap: Record<string, Partial<KanbanDataColumn>>,
  otherColumn: Partial<KanbanDataColumn>,
  collections: Collection[],
  linkTypes: LinkType[]
): KanbanData {
  let newColumnsTitles = Object.keys(columnsMap);
  const selectedAttributes = (currentConfig.stemsConfigs || [])
    .map(conf => conf.attribute)
    .filter(attribute => !!attribute);

  const newColumns: KanbanDataColumn[] = [];
  for (const currentColumn of currentConfig.columns || []) {
    const title = currentColumn.title;
    if (
      newColumnsTitles.includes(title) ||
      kanbanAttributesIntersect(currentColumn.createdFromAttributes, selectedAttributes)
    ) {
      const {cards = [], createdFromAttributes = [], constraint = null, summary = null} = columnsMap[title] || {};

      if (isColumnValid(cards, title, currentColumn.createdFromAttributes, collections, linkTypes)) {
        newColumns.push({
          id: getColumnIdOrGenerate(currentColumn),
          title,
          width: getColumnSizeTypeWidth(currentConfig.columnSize),
          cards,
          createdFromAttributes: createdFromAttributes || currentColumn.createdFromAttributes,
          constraint:
            constraint || constraintForKanbanAttributes(currentColumn.createdFromAttributes, collections, linkTypes),
          summary,
        });
        newColumnsTitles = newColumnsTitles.filter(newColumnTitle => newColumnTitle !== title);
      }
    }
  }

  for (const title of newColumnsTitles) {
    const {cards, createdFromAttributes, constraint, summary} = columnsMap[title];
    newColumns.push({
      id: generateId(),
      title,
      width: getColumnSizeTypeWidth(currentConfig.columnSize),
      cards,
      createdFromAttributes,
      constraint,
      summary,
    });
  }

  return {
    stemsConfigs: currentConfig?.stemsConfigs,
    columns: newColumns,
    otherColumn: {
      createdFromAttributes: otherColumn.createdFromAttributes,
      cards: otherColumn.cards,
      summary: otherColumn.summary,
      id: getColumnIdOrGenerate(currentConfig?.otherColumn),
      width: getColumnSizeTypeWidth(currentConfig?.columnSize),
    },
  };
}

function constraintForKanbanAttributes(
  kanbanAttributes: KanbanAttribute[],
  collections: Collection[],
  linkTypes: LinkType[]
): Constraint {
  for (const kanbanAttribute of kanbanAttributes || []) {
    const attribute = findAttributeByQueryAttribute(kanbanAttribute, collections, linkTypes);
    if (attribute?.constraint) {
      return attribute?.constraint;
    }
  }
  return null;
}

function pickKanbanConfigFromData(config: KanbanConfig, data: KanbanData): KanbanConfig {
  return {
    ...config,
    columns: data.columns.map(column => pickKanbanConfigColumn(column)),
    otherColumn: pickKanbanConfigColumn(data.otherColumn),
  };
}

function pickKanbanConfigColumn(column: KanbanDataColumn): KanbanColumn {
  return (
    column && {
      id: column.id,
      title: column.title,
      createdFromAttributes: column.createdFromAttributes,
      width: column.width,
    }
  );
}

function isColumnValid(
  cards: KanbanCard[],
  title: string,
  attributes: KanbanAttribute[],
  collections: Collection[],
  linkTypes: LinkType[]
): boolean {
  if ((cards || []).length > 0) {
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

  if (attribute.constraint?.type === ConstraintType.Select) {
    if (!attribute.constraint.createDataValue(title).isValid()) {
      return true;
    }
  }

  return false;
}

function getColumnIdOrGenerate(column: KanbanColumn): string {
  return column?.id || generateId();
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

function getDueHours(dataResource: DataResource, resource: AttributesResource, stemConfig: KanbanStemConfig): number {
  if (stemConfig?.dueDate?.attributeId && isNotNullOrUndefined(dataResource.data?.[stemConfig.dueDate.attributeId])) {
    let expectedFormat = null;
    const constraint = findAttributeConstraint(resource?.attributes, stemConfig.dueDate.attributeId);
    if (constraint && constraint.type === ConstraintType.DateTime) {
      expectedFormat = (constraint.config as DateTimeConstraintConfig).format;
    }

    const parsedDate = parseDateTimeByConstraint(dataResource.data[stemConfig.dueDate.attributeId], constraint);
    const dueDate = this.checkDueDate(parsedDate, expectedFormat);

    return moment(dueDate).diff(moment(), 'hours', true);
  }

  return null;
}

function checkDueDate(dueDate: Date, format: string): Date {
  if (!dueDate || !format) {
    return dueDate;
  }

  const options = createDateTimeOptions(format);
  if (options.hours) {
    return dueDate;
  }

  return moment(dueDate)
    .endOf('day')
    .toDate();
}
