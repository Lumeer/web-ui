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

import {SizeType} from '../../../shared/slider/size/size-type';
import {SearchTab} from '../navigation/search-tab';
import {DashboardTab} from '../../model/dashboard-tab';
import {AttributeSortType} from '../view-settings/view-settings';

export interface Search {
  id: string;
  config?: SearchConfig;
}

export interface SearchConfig {
  documents?: SearchTasksConfig;
  views?: SearchViewsConfig;
  searchTab?: string;
  dashboard?: Dashboard;
}

export interface Dashboard {
  viewId?: string;
  tabs?: DashboardTab[];
}

export interface SearchTasksConfig {
  expandedIds?: string[];
  size: SizeType;
  sortBy?: TasksConfigSortBy;
  groupBy?: TasksConfigGroupBy;
}

export type TasksConfigSortBy = TasksConfigSort[];
export type TasksConfigGroupBy = TaskConfigAttribute;

export interface TasksConfigSort {
  attribute: TaskConfigAttribute;
  type?: AttributeSortType;
}

export enum TaskConfigAttribute {
  DueDate = 'dueDate',
  Assignee = 'assignee',
  State = 'state',
  Priority = 'priority',
  LastUsed = 'lastUsed',
}

export const defaultTasksSortBy: TasksConfigSortBy = [
  {attribute: TaskConfigAttribute.DueDate},
  {attribute: TaskConfigAttribute.Priority},
  {attribute: TaskConfigAttribute.LastUsed},
];

export interface SearchViewsConfig {
  size: SizeType;
}

export const defaultSizeType = SizeType.S;

export function checkSizeType(sizeType: SizeType): SizeType {
  return sizeType === SizeType.XL ? SizeType.L : sizeType || defaultSizeType;
}

export function createDefaultSearchConfig(searchTab?: string): SearchConfig {
  return {
    searchTab: searchTab || SearchTab.All,
    documents: {size: defaultSizeType},
    views: {size: defaultSizeType},
  };
}
