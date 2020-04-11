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

import {Pipe, PipeTransform} from '@angular/core';
import {KanbanAggregation, KanbanColumn, KanbanConfig, KanbanValueType} from '../../../../core/store/kanbans/kanban';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {isKanbanAggregationDefined} from '../util/kanban.util';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {Constraint} from '../../../../core/model/constraint';
import {ConstraintData} from '../../../../core/model/data/constraint';
import Big from 'big.js';
import {filterNotNull} from '../../../../shared/utils/array.utils';
import {findConstraintByQueryAttribute} from '../../../../core/model/query-attribute';
import {convertToBig} from '../../../../shared/utils/data.utils';

interface AggregatedData {
  count: number;
  values: any[];
}

@Pipe({
  name: 'kanbanHeaderSummaries',
})
export class KanbanHeaderSummariesPipe implements PipeTransform {
  public transform(
    config: KanbanConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ): Record<string, string> {
    if (isKanbanAggregationDefined(config)) {
      const columns = filterNotNull([...(config.columns || []), config.otherColumn]);
      const columnsAggregated = columns.reduce(
        (aggr, column) => ({
          ...aggr,
          [column.id]: aggregateValues(column, config, documents, linkInstances),
        }),
        {}
      );

      const constraint = findConstraint(config, linkTypes, collections);
      if (config.aggregation?.valueType === KanbanValueType.AllPercentage) {
        return computeRelativeValue(columnsAggregated, config, constraint);
      } else {
        return columns.reduce((map, column) => {
          if (columnsAggregated[column.id]) {
            map[column.id] = formatAggregatedValue(
              columnsAggregated[column.id],
              config.aggregation,
              constraint,
              constraintData
            );
          }
          return map;
        }, {});
      }
    }

    return null;
  }
}

function findConstraint(config: KanbanConfig, linkTypes: LinkType[], collections: Collection[]): Constraint {
  for (const stemConfig of config.stemsConfigs) {
    const constraint = findConstraintByQueryAttribute(stemConfig.aggregation, collections, linkTypes);
    if (constraint) {
      return constraint;
    }
  }

  return new UnknownConstraint();
}

function computeRelativeValue(
  columnsMap: Record<string, AggregatedData>,
  config: KanbanConfig,
  constraint: Constraint
): Record<string, any> {
  const values: Record<string, any> = {};
  let total = 0;

  Object.keys(columnsMap).forEach(key => {
    if (columnsMap[key]) {
      values[key] = aggregateDataValues(config.aggregation.aggregation, columnsMap[key].values, constraint, true) || 0;
      total += values[key];
    }
  });

  Object.keys(columnsMap).forEach(key => {
    if (columnsMap[key] && total > 0) {
      const bigNumber = convertToBig((values[key] / total) * 100);
      if (bigNumber) {
        values[key] = bigNumber.toFixed(2) + '%';
      }
    }
  });

  return values;
}

function formatAggregatedValue(
  data: AggregatedData,
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

function aggregateValues(
  column: KanbanColumn,
  config: KanbanConfig,
  documents: DocumentModel[],
  linkInstances: LinkInstance[]
): AggregatedData {
  return (column.resourcesOrder || []).reduce(
    (sum, resourceOrder) => {
      const stemConfig = config.stemsConfigs?.[resourceOrder.stemIndex];
      if (stemConfig?.aggregation) {
        let dataResource: DataResource = null;
        if (resourceOrder.resourceType === AttributesResourceType.Collection) {
          dataResource = (documents || []).find(document => document.id === resourceOrder.id);
        } else if (resourceOrder.resourceType === AttributesResourceType.LinkType) {
          dataResource = (linkInstances || []).find(linkType => linkType.id === resourceOrder.id);
        }

        const value = dataResource?.data?.[stemConfig.aggregation.attributeId];
        if (isNotNullOrUndefined(value)) {
          sum.count++;
          sum.values.push(value);
        }
      }

      return sum;
    },
    {count: 0, values: []}
  );
}
