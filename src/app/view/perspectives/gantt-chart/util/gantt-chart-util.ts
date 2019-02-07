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

export function createGanttChartTasks(
  config: GanttChartConfig,
  collections: Collection[],
  documents: DocumentModel[]
): GanttChartTask[] {
  return collections.reduce(
    (tasks, collection) => [
      ...tasks,
      ...createGanttChartTasksForCollection(config, collection, documentsByCollection(documents, collection)),
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
  documents: DocumentModel[]
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

  const tasks = [];

  for (const document of documents) {
    const name = nameProperty && document.data[nameProperty.attributeId];
    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];

    const id = idProperty && document.data[idProperty.attributeId];
    const dependencies = dependenciesProperty && document.data[dependenciesProperty.attributeId];
    const progress = progressProperty && (document.data[progressProperty.attributeId] || 0);

    const task = {name, start, end, id, dependencies, progress};

    if (isTaskValid(task)) {
      tasks.push({
        ...task,
        start: cleanDate(task.start),
        end: cleanDate(task.end),
        progress: Math.max(+task.progress, 0),
        documentId: document.id,
        collectionId: collection.id,
        color: collection.color,
      });
    }
  }

  return tasks;
}

function isTaskValid(task: GanttChartTask): boolean {
  return (
    task.name &&
    (task.start && isDateValid(task.start)) &&
    (task.end && isDateValid(task.end)) &&
    (isNullOrUndefined(task.progress) || isNumeric(task.progress))
  );
}

function isDateValid(date: string): boolean {
  return moment(date).isValid();
}

function cleanDate(date: string): string {
  return moment(date).format(GANTT_DATE_FORMAT);
}

export function ganttTasksChanged(newTasks: GanttChartTask[], currentTasks: any[]): boolean {
  const tasks1 = (newTasks && newTasks.map(task => cleanGanttTask(task))) || [];
  const tasks2 = (currentTasks && currentTasks.map(task => cleanGanttTask(task))) || [];
  return !deepArrayEquals(tasks1, tasks2);
}

function cleanGanttTask(task: GanttChartTask | any): GanttChartTask {
  return {
    name: task.name,
    progress: task.progress,
    start: task.start,
    end: task.end,
    collectionId: task.collectionId,
    color: task.color,
    dependencies: cleanGanttTaskDependencies(task.dependencies),
    documentId: task.documentId,
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
