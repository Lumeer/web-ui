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

import {ConstraintData} from '@lumeer/data-filters';
import {GanttTask} from '@lumeer/lumeer-gantt';
import {GANTT_DATE_FORMAT} from '../../../../core/store/gantt-charts/gantt-chart';
import {Query} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {queriesAreSame} from '../../../../core/store/navigation/query/query.util';
import {areArraysSame, isArraySortedSubset} from '../../../../shared/utils/array.utils';
import {ViewSettings} from '../../../../core/store/view-settings/view-settings';
import {
  viewAttributeSettingsSortChanged,
  viewAttributeSettingsSortDefined,
} from '../../../../shared/settings/settings.util';
import {sortDataResourcesObjectsByViewSettings} from '../../../../shared/utils/data-resource.utils';
import * as moment from 'moment/moment';

export interface GanttTasksSort {
  order: GanttTasksOrder;
  settings: ViewSettings;
  query: Query;
}

export type GanttTasksOrder = Record<string, number>;

export function sortGanttTasks(
  tasks: GanttTask[],
  currentSort: GanttTasksSort,
  dataLoaded: boolean,
  query: Query,
  settings: ViewSettings,
  collections: Collection[],
  linkTypes: LinkType[],
  constraintData: ConstraintData
): {tasks: GanttTask[]; sort: GanttTasksSort; sortChanged?: boolean} {
  let order: GanttTasksOrder;
  if (currentSort) {
    const queryChanged = !queriesAreSame(currentSort.query, query);
    const sortChanged = viewAttributeSettingsSortChanged(currentSort.settings?.attributes, settings?.attributes);
    if (!queryChanged && !sortChanged) {
      order = currentSort.order;
    }
  }
  if (order) {
    tasks = tasks.sort((t1, t2) => {
      const index1 = order[t1.id] ?? Number.MAX_SAFE_INTEGER;
      const index2 = order[t2.id] ?? Number.MAX_SAFE_INTEGER;
      return index1 - index2;
    });

    const sortChanged = checkGanttSortChanged(order, tasks, settings, collections, linkTypes, constraintData);
    const sort = currentSort;
    return {sort, tasks, sortChanged};
  } else {
    tasks = sortTasksBySettings(tasks, settings, collections, linkTypes, constraintData);
    const sort = dataLoaded ? {order: createGanttTasksOrder(tasks), query, settings} : undefined;
    return {sort, tasks};
  }
}

function sortTasksBySettings(
  tasks: GanttTask[],
  settings: ViewSettings,
  collections: Collection[],
  linkTypes: LinkType[],
  constraintData: ConstraintData
): GanttTask[] {
  if (viewAttributeSettingsSortDefined(settings)) {
    return sortDataResourcesObjectsByViewSettings(
      tasks,
      settings,
      collections,
      linkTypes,
      constraintData,
      task => task.metadata.dataResource,
      task => task.metadata.resource,
      (a, b) => compareTasks(a, b)
    );
  } else {
    return [...tasks].sort((t1, t2) => compareTasksByStartDate(t1, t2));
  }
}
function checkGanttSortChanged(
  currentOrder: GanttTasksOrder,
  tasks: GanttTask[],
  settings: ViewSettings,
  collections: Collection[],
  linkTypes: LinkType[],
  constraintData: ConstraintData
): boolean {
  const sortedTasks = sortTasksBySettings(tasks, settings, collections, linkTypes, constraintData);
  const newOrder = createGanttTasksOrder(sortedTasks);
  const currentIds = Object.keys(currentOrder);
  const newIds = Object.keys(newOrder);

  return !areArraysSame(currentIds, newIds) && !isArraySortedSubset(currentIds, newIds);
}

function createGanttTasksOrder(tasks: GanttTask[]): GanttTasksOrder {
  return tasks.reduce((map, task, index) => ({...map, [task.id]: index}), {});
}

function compareTasks(t1: GanttTask, t2: GanttTask): number {
  const t1Swimlanes = t1.swimlanes?.map(s => s?.value) || [];
  const t2Swimlanes = t2.swimlanes?.map(s => s?.value) || [];

  if (areArraysSame(t1Swimlanes, t2Swimlanes)) {
    return compareTasksByStartDate(t1, t2);
  }
  return 0;
}

function compareTasksByStartDate(t1: GanttTask, t2: GanttTask): number {
  const t1Start = moment(t1.start, GANTT_DATE_FORMAT);
  const t2Start = moment(t2.start, GANTT_DATE_FORMAT);
  return t1Start.isAfter(t2Start) ? 1 : t1Start.isBefore(t2Start) ? -1 : 0;
}
