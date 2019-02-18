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
  GANTT_DATE_FORMAT,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartCollectionConfig,
  GanttChartConfig,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {Collection} from '../../../../core/store/collections/collection';
import {isArray, isNullOrUndefined, isNumeric} from '../../../../shared/utils/common.utils';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import * as moment from 'moment';
import {deepArrayEquals} from '../../../../shared/utils/array.utils';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';

export function createGanttChartTasks(
  config: GanttChartConfig,
  collections: Collection[],
  documents: DocumentModel[],
  permissions: Record<string, AllowedPermissions>
): GanttChartTask[] {
  return collections.reduce(
    (tasks, collection) => [
      ...tasks,
      ...createGanttChartTasksForCollection(
        config,
        collection,
        documentsByCollection(documents, collection),
        permissions[collection.id] || {}
      ),
    ],
    []
  );
}

function documentsByCollection(documents: DocumentModel[], collection: Collection): DocumentModel[] {
  return documents && documents.filter(document => document.collectionId === collection.id);
}

function createGanttChartTasksForCollection(
  config: GanttChartConfig,
  collection: Collection,
  documents: DocumentModel[],
  permissions: AllowedPermissions
): GanttChartTask[] {
  const collectionConfig: GanttChartCollectionConfig = config.collections && config.collections[collection.id];

  if (!collectionConfig || !collectionConfig.barsProperties) {
    return [];
  }

  const nameProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.NAME];
  const startProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.START];
  const endProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.END];
  const idProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.ID];
  const dependenciesProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES];
  const progressProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.PROGRESS];
  const disabled = !permissions.writeWithView;
  const customClass = disabled ? 'gantt-bar-disabled' : null;

  let idDependenciesMap: Record<string, string> = {};
  if (idProperty && dependenciesProperty) {
    idDependenciesMap = documents.reduce((map, document) => {
      const name = nameProperty && document.data[nameProperty.attributeId];
      const start = startProperty && document.data[startProperty.attributeId];
      const end = endProperty && document.data[endProperty.attributeId];
      const id = document.data[idProperty.attributeId];
      if (!map[id] && isTaskValid(name, start, end)) {
        map[id] = document.id;
      }
      return map;
    }, {});
  }

  const tasks = [];

  for (const document of documents) {
    const name = nameProperty && document.data[nameProperty.attributeId];
    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];

    if (isTaskValid(name, start, end)) {
      const interval = createInterval(start, startProperty.attributeId, end, endProperty.attributeId);
      const dependencies = dependenciesProperty && document.data[dependenciesProperty.attributeId];
      const progress = progressProperty && (document.data[progressProperty.attributeId] || 0);

      tasks.push({
        id: document.id,
        name,
        dependencies: createDependencies(dependencies, idDependenciesMap),
        start: interval[0].value,
        startAttributeId: interval[0].attrId,
        end: interval[1].value,
        endAttributeId: interval[1].attrId,
        progress: createProgress(progress),
        progressAttributeId: progressProperty && progressProperty.attributeId,
        collectionId: collection.id,
        color: collection.color,
        custom_class: customClass,
        disabled,
      });
    }
  }

  return tasks;
}

function createDependencies(dependencies: any, idDependenciesMap: Record<string, string>): string {
  if (isNullOrUndefined(dependencies)) {
    return '';
  }

  return dependencies
    .toString()
    .split(',')
    .map(part => idDependenciesMap[part.trim()])
    .filter(value => !!value)
    .join(',');
}

function isTaskValid(name: string, start: string, end: string): boolean {
  return name && (start && isDateValid(start)) && (end && isDateValid(end));
}

function isDateValid(date: string): boolean {
  return moment(date).isValid();
}

function createProgress(progress: any): number {
  if (isNullOrUndefined(progress)) {
    return 0;
  }
  if (isNumeric(progress)) {
    return Math.max(+progress, 0);
  }
  return 0;
}

function createInterval(
  start: string,
  startAttributeId,
  end: string,
  endAttributeId: string
): [{value: string; attrId: string}, {value: string; attrId: string}] {
  const startDate = moment(start);
  const endDate = moment(end);
  const startDateObj = {value: startDate.format(GANTT_DATE_FORMAT), attrId: startAttributeId};
  const endDateObj = {value: endDate.format(GANTT_DATE_FORMAT), attrId: endAttributeId};

  if (endDate.isAfter(startDate)) {
    return [startDateObj, endDateObj];
  }
  return [endDateObj, startDateObj];
}

export function ganttTasksChanged(newTasks: GanttChartTask[], currentTasks: any[]): boolean {
  const tasks1 = (newTasks && newTasks.map(task => cleanGanttTask(task))) || [];
  const tasks2 = (currentTasks && currentTasks.map(task => cleanGanttTask(task))) || [];
  return !deepArrayEquals(tasks1, tasks2);
}

function cleanGanttTask(task: GanttChartTask | any): GanttChartTask {
  return {
    id: task.id,
    name: task.name,
    progress: task.progress,
    start: task.start,
    startAttributeId: task.startAttributeId,
    progressAttributeId: task.progressAttributeId,
    end: task.end,
    endAttributeId: task.endAttributeId,
    collectionId: task.collectionId,
    color: task.color,
    dependencies: cleanGanttTaskDependencies(task.dependencies),
    disabled: task.disabled,
  };
}

function cleanGanttTaskDependencies(dependencies: any): string {
  if (isNullOrUndefined(dependencies)) {
    return '';
  }
  if (isArray(dependencies)) {
    return dependencies.map(dep => dep.toString()).join(',');
  }
  return dependencies
    .toString()
    .split(',')
    .map(dep => dep.trim())
    .join(',');
}
