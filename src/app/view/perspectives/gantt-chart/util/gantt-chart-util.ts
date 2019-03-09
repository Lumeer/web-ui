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
import {isDateValid, isNullOrUndefined, isNumeric, toNumber} from '../../../../shared/utils/common.utils';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import * as moment from 'moment';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {parseDateTimeDataValue} from '../../../../shared/utils/data.utils';
import {isAttributeEditable} from '../../../../core/store/collections/collection.util';

const MIN_PROGRESS = 0.001;
const MAX_PROGRESS = 1000;

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

  const nameProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.Name];
  const startProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.Start];
  const endProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.End];
  const progressProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.Progress];
  const disabled = !permissions.writeWithView;
  const customClass = disabled ? 'gantt-bar-disabled' : null;

  const validDocumentsMap: Record<string, DocumentModel> = documents.reduce((map, document) => {
    const name = nameProperty && document.data[nameProperty.attributeId];
    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];
    if (!map[document.id] && isTaskValid(name, start, end)) {
      map[document.id] = document;
    }
    return map;
  }, {});

  const tasks = [];

  for (const document of Object.values(validDocumentsMap)) {
    const name = nameProperty && document.data[nameProperty.attributeId];
    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];

    const startEditable = isAttributeEditable(startProperty.attributeId, collection);
    const endEditable = isAttributeEditable(endProperty.attributeId, collection);

    const interval = createInterval(
      start,
      startEditable && startProperty.attributeId,
      end,
      endEditable && endProperty.attributeId
    );
    const progress = progressProperty && (document.data[progressProperty.attributeId] || 0);
    const progressEditable = isAttributeEditable(progressProperty && progressProperty.attributeId, collection);

    tasks.push({
      id: document.id,
      name,
      dependencies: createDependencies(document, validDocumentsMap),
      start: interval[0].value,
      startAttributeId: interval[0].attrId,
      end: interval[1].value,
      endAttributeId: interval[1].attrId,
      progress: createProgress(progress),
      progressAttributeId: progressEditable && progressProperty && progressProperty.attributeId,
      collectionId: collection.id,
      color: collection.color,
      custom_class: customClass,
      disabled,
    });
  }

  return tasks;
}

function createDependencies(document: DocumentModel, documentsMap: Record<string, DocumentModel>): string {
  if (document.metaData && document.metaData.parentId && documentsMap[document.metaData.parentId]) {
    return document.metaData.parentId;
  }
  return '';
}

function isTaskValid(name: string, start: string, end: string): boolean {
  return name && areDatesValid(start, end);
}

function areDatesValid(start: string, end: string): boolean {
  return isDateValid(parseDateTimeDataValue(start)) && isDateValid(parseDateTimeDataValue(end));
}

function createProgress(progress: any): number {
  if (isNullOrUndefined(progress)) {
    return MIN_PROGRESS;
  }

  const progressWithoutPercent = progress.toString().replace(/%*$/g, '');
  if (isNumeric(progressWithoutPercent)) {
    return Math.min(Math.max(toNumber(progressWithoutPercent), MIN_PROGRESS), MAX_PROGRESS);
  }
  return MIN_PROGRESS;
}

function createInterval(
  start: string,
  startAttributeId,
  end: string,
  endAttributeId: string
): [{value: Date; attrId: string}, {value: Date; attrId: string}] {
  const startDate = moment(parseDateTimeDataValue(start));
  const endDate = moment(parseDateTimeDataValue(end));
  const startDateObj = {value: startDate.toDate(), attrId: startAttributeId};
  const endDateObj = {value: endDate.toDate(), attrId: endAttributeId};

  if (endDate.isAfter(startDate)) {
    return [startDateObj, endDateObj];
  }
  return [endDateObj, startDateObj];
}
