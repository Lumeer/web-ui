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
import {Perspective, perspectiveIconsMap} from '../../../view/perspectives/perspective';
import {createChartSaveConfig, isChartConfigChanged} from '../charts/chart.util';
import {Collection} from '../collections/collection';
import {DocumentModel} from '../documents/document.model';
import {LinkType} from '../link-types/link.type';
import {isMapConfigChanged} from '../maps/map-config.utils';
import {TableConfig} from '../tables/table.model';
import {isTableConfigChanged} from '../tables/utils/table-config-changed.utils';
import {createTableSaveConfig} from '../tables/utils/table-save-config.util';
import {DataSettings, PerspectiveConfig, View, ViewConfig, ViewSettings} from './view';
import {isPivotConfigChanged} from '../../../view/perspectives/pivot/util/pivot-util';
import {deepObjectsEquals, isNullOrUndefined} from '../../../shared/utils/common.utils';
import {CalendarConfig} from '../calendars/calendar';
import {
  createSaveAttributesSettings,
  viewAttributeSettingsChanged,
  viewAttributeSettingsSortChanged,
} from '../../../shared/settings/settings.util';
import {Query} from '../navigation/query/query';
import {ChartConfig} from '../charts/chart';
import {createWorkflowSaveConfig, isWorkflowConfigChanged} from '../workflows/workflow.utils';
import {WorkflowConfig} from '../workflows/workflow';
import {createDetailSaveConfig, isDetailConfigChanged} from '../details/detail.utils';
import {DetailConfig} from '../details/detail';

export function isViewConfigChanged(
  perspective: Perspective,
  viewConfig: ViewConfig,
  perspectiveConfig: ViewConfig,
  documentsMap: Record<string, DocumentModel>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return getPerspectiveSavedPerspectives(perspective).some(savedPerspective =>
    isPerspectiveConfigChanged(
      savedPerspective,
      viewConfig?.[savedPerspective],
      perspectiveConfig?.[savedPerspective],
      documentsMap,
      collectionsMap,
      linkTypesMap
    )
  );
}

export function isPerspectiveConfigChanged(
  perspective: Perspective,
  viewConfig: any,
  perspectiveConfig: any,
  documentsMap: Record<string, DocumentModel>,
  collectionsMap: Record<string, Collection>,
  linkTypesMap: Record<string, LinkType>
): boolean {
  if (isNullOrUndefined(viewConfig) || isNullOrUndefined(perspectiveConfig)) {
    return false;
  }
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
      return isWorkflowConfigChanged(viewConfig, perspectiveConfig);
    case Perspective.Detail:
      return isDetailConfigChanged(viewConfig, perspectiveConfig, collectionsMap, linkTypesMap);
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
    case Perspective.Workflow:
      return createWorkflowSaveConfig(config as WorkflowConfig);
    case Perspective.Chart:
      return createChartSaveConfig(config as ChartConfig);
    case Perspective.Detail:
      return createDetailSaveConfig(config as DetailConfig);
    default:
      return config;
  }
}

/**
 * Creates perspective config with modifications before saving in a view
 */
export function createViewSaveConfig(perspective: Perspective, config: ViewConfig, currentView: View): ViewConfig {
  return getPerspectiveSavedPerspectives(perspective).reduce(
    (savedConfig, savedPerspective) => ({
      ...savedConfig,
      [savedPerspective]: createPerspectiveSaveConfig(
        savedPerspective,
        config?.[savedPerspective] || currentView?.config?.[savedPerspective]
      ),
    }),
    {}
  );
}

/**
 * In some cases multiple configs are saved (i.e. workflow + detail)
 */
export function getPerspectiveSavedPerspectives(perspective: Perspective): Perspective[] {
  switch (perspective) {
    case Perspective.Detail:
      return [perspective];
    default:
      return [perspective, Perspective.Detail];
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
  return (
    viewDataSettingsChanged(previousSettings?.data, currentSettings?.data) ||
    viewAttributeSettingsChanged(
      previousSettings?.attributes,
      currentSettings?.attributes,
      collectionsMap,
      linkTypesMap
    )
  );
}

export function viewSettingsSortChanged(previousSettings: ViewSettings, currentSettings: ViewSettings): boolean {
  return viewAttributeSettingsSortChanged(previousSettings?.attributes, currentSettings?.attributes);
}

export function viewDataSettingsChanged(previousSettings: DataSettings, currentSettings: DataSettings): boolean {
  return !!previousSettings?.includeSubItems !== !!currentSettings?.includeSubItems;
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

export function getViewColor(view: View, collectionsMap: Record<string, Collection>): string {
  return view?.color || defaultViewColorFromQuery(view, collectionsMap);
}

export function defaultViewColorFromQuery(view: View, collectionsMap: Record<string, Collection>): string {
  const firstStemCollectionId = view?.query?.stems?.[0]?.collectionId;
  return (firstStemCollectionId && collectionsMap?.[firstStemCollectionId]?.color) || '';
}

export function getViewIcon(view: View): string {
  return view?.icon || defaultViewIcon(view);
}

export function defaultViewIcon(view: View): string {
  return perspectiveIconsMap[view?.perspective] || '';
}

export function cleanClonedView(view: View): View {
  return {...view, code: undefined, folders: undefined, favorite: undefined, priority: undefined};
}
