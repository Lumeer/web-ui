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

import {DataAggregationType} from '../../../shared/utils/data/data-aggregation';
import {QueryStem} from '../navigation/query/query';
import {QueryAttribute, QueryResource} from '../../model/query-attribute';
import {SizeType} from '../../../shared/slider/size/size-type';
import {PostItLayoutType} from '../../../shared/post-it/post-it-layout-type';

export const DEFAULT_KANBAN_ID = 'default';

export interface Kanban {
  id: string;
  config?: KanbanConfig;
}

export interface KanbanConfig {
  columns: KanbanColumn[];
  otherColumn?: KanbanColumn;
  stemsConfigs: KanbanStemConfig[];
  version?: KanbanConfigVersion;
  aggregation?: KanbanAggregation;
  columnSize?: SizeType;
  cardLayout?: PostItLayoutType;
}

export enum KanbanConfigVersion {
  V2 = '2',
  V1 = '1',
}

export interface KanbanColumn {
  id: string;
  title?: any;
  width: number;
  createdFromAttributes?: KanbanAttribute[];
}

export interface KanbanStemConfig {
  stem?: QueryStem;
  attribute: KanbanAttribute;
  aggregation?: KanbanAttribute;
  resource?: KanbanResource;
  dueDate?: KanbanAttribute;
  doneColumnTitles?: any[];
}

export interface KanbanAttribute extends QueryAttribute {}

export interface KanbanResource extends QueryResource {}

export enum KanbanValueType {
  Default = 'default',
  AllPercentage = 'all',
}

export interface KanbanAggregation {
  aggregation?: DataAggregationType;
  valueType?: KanbanValueType;
}
