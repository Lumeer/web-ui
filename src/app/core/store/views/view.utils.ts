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

import {
  createCalendarSaveConfig,
  isCalendarConfigChanged,
} from '../../../view/perspectives/calendar/util/calendar-util';
import {isGanttConfigChanged} from '../../../view/perspectives/gantt-chart/util/gantt-chart-util';
import {isKanbanConfigChanged} from '../../../view/perspectives/kanban/util/kanban.util';
import {Perspective} from '../../../view/perspectives/perspective';
import {createChartSaveConfig, isChartConfigChanged} from '../charts/chart.util';
import {Collection} from '../collections/collection';
import {DocumentModel} from '../documents/document.model';
import {LinkType} from '../link-types/link.type';
import {isMapConfigChanged} from '../maps/map-config.utils';
import {TableConfig} from '../tables/table.model';
import {isTableConfigChanged} from '../tables/utils/table-config-changed.utils';
import {createTableSaveConfig} from '../tables/utils/table-save-config.util';
import {PerspectiveConfig, View, ViewSettings} from './view';
import {isPivotConfigChanged} from '../../../view/perspectives/pivot/util/pivot-util';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {CalendarConfig} from '../calendars/calendar';
import {createSaveAttributesSettings, viewAttributeSettingsChanged} from '../../../shared/settings/settings.util';
import {Query} from '../navigation/query/query';
import {ChartConfig} from '../charts/chart';
import {isWorkflowConfigChanged} from '../workflows/workflow.utils';

export function isViewConfigChanged(
  perspective: Perspective,
  viewConfig: any,
  perspectiveConfig: any,
  documentsMap: Record<string, DocumentModel>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>,
  query: Query
): boolean {
  switch (perspective) {
    case Perspective.Table:
      return isTableConfigChanged(viewConfig, perspectiveConfig, documentsMap, collectionsMap, linkTypesMap);
    case Perspective.Chart:
      return isChartConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.GanttChart:
      return isGanttConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Calendar:
      return isCalendarConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Kanban:
      return isKanbanConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Map:
      return isMapConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Pivot:
      return isPivotConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Workflow:
      return isWorkflowConfigChanged(viewConfig, perspectiveConfig, query);
    default:
      return !deepObjectsEquals(viewConfig, perspectiveConfig);
  }
}

/**
 * Creates perspective config with modifications before saving in a view
 */
export function createPerspectiveSaveConfig(perspective: Perspective, config: PerspectiveConfig): PerspectiveConfig {
  switch (perspective) {
    case Perspective.Calendar:
      return createCalendarSaveConfig(config as CalendarConfig);
    case Perspective.Table:
      return createTableSaveConfig(config as TableConfig);
    case Perspective.Chart:
      return createChartSaveConfig(config as ChartConfig);
    default:
      return config;
  }
}

export function preferViewConfigUpdate(
  previousConfig: PerspectiveConfig,
  viewConfig: PerspectiveConfig,
  hasStoreConfig: boolean
): boolean {
  if (!previousConfig) {
    return !hasStoreConfig;
  }
  return !deepObjectsEquals(previousConfig, viewConfig);
}

export function viewSettingsChanged(
  previousSettings: ViewSettings,
  currentSettings: ViewSettings,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return viewAttributeSettingsChanged(
    previousSettings?.attributes,
    currentSettings?.attributes,
    collectionsMap,
    linkTypesMap
  );
}

export function createSaveViewSettings(
  settings: ViewSettings,
  query: Query,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): ViewSettings {
  return (
    settings && {
      ...settings,
      attributes: createSaveAttributesSettings(settings.attributes, query, collectionsMap, linkTypesMap),
    }
  );
}
