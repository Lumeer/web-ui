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

import {AttributesResourceType} from '../../model/resource';

export const DEFAULT_GANTT_CHART_ID = 'default';
export const GANTT_DATE_FORMAT = 'YYYY-MM-DD';

export interface GanttChart {
  id: string;
  config?: GanttChartConfig;
}

export interface GanttChartConfig {
  mode: GanttChartMode;
  collections: Record<string, GanttChartCollectionConfig>;
}

export interface GanttChartCollectionConfig {
  barsProperties: Record<string, GanttChartBarModel>;
}

export interface GanttChartBarModel {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
}

export interface GanttChartTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  start_drag: boolean;
  end_drag: boolean;
  editable: boolean;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  swimlane?: string;
  sub_swimlane?: string;

  // custom attributes
  dataResourceId: string;
  collectionConfigId: string;
  startAttributeId: string;
  endAttributeId: string;
  progressAttributeId: string;
  resourceId?: string;
  resourceType: AttributesResourceType;
}

export enum GanttChartMode {
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}

export type GanttChartBarProperty = GanttChartBarPropertyRequired | GanttChartBarPropertyOptional;

export enum GanttChartBarPropertyRequired {
  Name = 'name',
  Start = 'start',
  End = 'end',
}

export enum GanttChartBarPropertyOptional {
  Progress = 'progress',
  Color = 'color',
  Category = 'category',
  SubCategory = 'subCategory',
}

export function convertGanttChartDtoConfigToModel(config: any): GanttChartConfig {
  if (!config || !config.collections) {
    return config;
  }

  const collections: Record<string, GanttChartCollectionConfig> = {};
  for (const [collectionId, collectionConfig] of Object.entries<GanttChartCollectionConfig>(config.collections)) {
    const barsProperties: Record<string, GanttChartBarModel> = {};

    for (const [key, model] of Object.entries(collectionConfig.barsProperties || {})) {
      barsProperties[key] = {
        resourceId: model.resourceId || (model as any).collectionId,
        attributeId: model.attributeId,
        resourceIndex: model.resourceIndex || 0,
        resourceType: model.resourceType || AttributesResourceType.Collection,
      };
    }
    collections[collectionId] = {barsProperties};
  }

  return {mode: config.mode, collections};
}
