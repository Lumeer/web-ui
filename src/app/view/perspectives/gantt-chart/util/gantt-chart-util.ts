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

import {Constraint, ConstraintData} from '../../../../core/model/data/constraint';
import {
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartCollectionConfig,
  GanttChartConfig,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {Collection} from '../../../../core/store/collections/collection';
import {
  deepObjectsEquals,
  isDateValid,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {formatData, formatDataValue, parseDateTimeDataValue} from '../../../../shared/utils/data.utils';
import {
  findAttribute,
  findAttributeConstraint,
  isCollectionAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {Query} from '../../../../core/store/navigation/query';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {contrastColor} from '../../../../shared/utils/color.utils';
import {createDataValueHtml} from '../../../../shared/utils/data/data-html.utils';

const MIN_PROGRESS = 0.001;
const MAX_PROGRESS = 1000;

export function createGanttChartTasks(
  config: GanttChartConfig,
  collections: Collection[],
  documents: DocumentModel[],
  permissions: Record<string, AllowedPermissions>,
  constraintData: ConstraintData,
  query?: Query
): GanttChartTask[] {
  return collections.reduce(
    (tasks, collection) => [
      ...tasks,
      ...createGanttChartTasksForCollection(
        config,
        collection,
        documentsByCollection(documents, collection),
        permissions[collection.id] || {},
        constraintData,
        query
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
  permissions: AllowedPermissions,
  constraintData: ConstraintData,
  query?: Query
): GanttChartTask[] {
  const collectionConfig: GanttChartCollectionConfig = config.collections && config.collections[collection.id];

  if (!collectionConfig || !collectionConfig.barsProperties) {
    return [];
  }

  const nameProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.Name];
  const startProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.Start];
  const endProperty = collectionConfig.barsProperties[GanttChartBarPropertyRequired.End];
  const progressProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.Progress];
  const swimlaneProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.Category];
  const subSwimlaneProperty = collectionConfig.barsProperties[GanttChartBarPropertyOptional.SubCategory];

  const validDocumentsMap: Record<string, DocumentModel> = documents.reduce((map, document) => {
    const name = nameProperty && document.data[nameProperty.attributeId];
    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];
    if (!map[document.id] && isTaskValid(name, start, end)) {
      map[document.id] = document;
    }
    return map;
  }, {});

  const tasks: GanttChartTask[] = [];

  for (const document of Object.values(validDocumentsMap)) {
    const formattedData = formatData(document.data, collection.attributes, constraintData);

    const name = nameProperty && document.data[nameProperty.attributeId];
    const nameAttribute = nameProperty && findAttribute(collection.attributes, nameProperty.attributeId);

    const start = startProperty && document.data[startProperty.attributeId];
    const end = endProperty && document.data[endProperty.attributeId];

    const startEditable = isCollectionAttributeEditable(startProperty.attributeId, collection, permissions, query);
    const endEditable = isCollectionAttributeEditable(endProperty.attributeId, collection, permissions, query);

    const interval = createInterval(
      start,
      startEditable && startProperty.attributeId,
      end,
      endEditable && endProperty.attributeId
    );
    const progress = progressProperty && (formattedData[progressProperty.attributeId] || 0);
    const progressEditable = isCollectionAttributeEditable(
      progressProperty && progressProperty.attributeId,
      collection,
      permissions,
      query
    );

    const swimlaneConstraint =
      swimlaneProperty && findAttributeConstraint(collection.attributes, swimlaneProperty.attributeId);
    const swimlaneValue = swimlaneProperty && document.data[swimlaneProperty.attributeId];

    const subSwimlaneConstraint =
      subSwimlaneProperty && findAttributeConstraint(collection.attributes, subSwimlaneProperty.attributeId);
    const subSwimlaneValue = subSwimlaneProperty && document.data[subSwimlaneProperty.attributeId];

    tasks.push({
      id: document.id,
      name: createDataValueHtml(name, nameAttribute && nameAttribute.constraint, constraintData),
      start: interval[0].value,
      end: interval[1].value,
      progress: createProgress(progress),
      dependencies: createDependencies(document, validDocumentsMap),
      primary_color: shadeColor(collection.color, 0.5),
      secondary_color: shadeColor(collection.color, 0.3),
      start_drag: startEditable,
      end_drag: endEditable,
      editable: startEditable && endEditable,
      text_color: contrastColor(collection.color),
      swimlane: formatSwimlaneValue(swimlaneValue, swimlaneConstraint, constraintData),
      sub_swimlane: formatSwimlaneValue(subSwimlaneValue, subSwimlaneConstraint, constraintData),

      startAttributeId: interval[0].attrId,
      endAttributeId: interval[1].attrId,
      progressAttributeId: progressEditable && progressProperty && progressProperty.attributeId,
      collectionId: collection.id,
    });
  }

  return tasks;
}

function formatSwimlaneValue(value: any, constraint: Constraint, constraintData: ConstraintData): string | null {
  const formattedValue = formatDataValue(value, constraint, constraintData);
  return formattedValue && formattedValue !== '' ? formattedValue.toString() : undefined;
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
  startAttributeId: string,
  end: string,
  endAttributeId: string
): [{value: Date; attrId: string}, {value: Date; attrId: string}] {
  const startDate = parseDateTimeDataValue(start);
  const endDate = parseDateTimeDataValue(end);

  const startDateObj = {value: startDate, attrId: startAttributeId};
  const endDateObj = {value: endDate, attrId: endAttributeId};

  if (endDate.getTime() > startDate.getTime()) {
    return [startDateObj, endDateObj];
  }
  return [endDateObj, startDateObj];
}

export function isGanttConfigChanged(viewConfig: GanttChartConfig, currentConfig: GanttChartConfig): boolean {
  if (viewConfig.mode !== currentConfig.mode) {
    return true;
  }

  return ganttConfigCollectionsChanged(viewConfig.collections || {}, currentConfig.collections || {});
}

function ganttConfigCollectionsChanged(
  collections1: Record<string, GanttChartCollectionConfig>,
  collections2: Record<string, GanttChartCollectionConfig>
): boolean {
  if (Object.keys(collections1).length !== Object.keys(collections2).length) {
    return true;
  }

  return Object.entries(collections1).some(([key, value]) => {
    return !collections2[key] || ganttConfigCollectionChanged(value, collections2[key]);
  });
}

function ganttConfigCollectionChanged(
  config1: GanttChartCollectionConfig,
  config2: GanttChartCollectionConfig
): boolean {
  if (Object.keys(config1.barsProperties).length !== Object.keys(config2.barsProperties).length) {
    return true;
  }

  return Object.entries(config1.barsProperties).some(([key, value]) => {
    return !config2.barsProperties[key] || !deepObjectsEquals(value, config2.barsProperties[key]);
  });
}
