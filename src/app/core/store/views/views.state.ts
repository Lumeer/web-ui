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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {Perspective} from '../../../view/perspectives/perspective';
import {AppState} from '../app.state';
import {selectCalendarConfig} from '../calendars/calendars.state';
import {selectChartConfig} from '../charts/charts.state';
import {selectCollectionsDictionary} from '../collections/collections.state';
import {selectDocumentsDictionary} from '../documents/documents.state';
import {selectGanttChartConfig} from '../gantt-charts/gantt-charts.state';
import {selectKanbanConfig} from '../kanbans/kanban.state';
import {selectLinkTypesDictionary} from '../link-types/link-types.state';
import {selectMapConfig} from '../maps/maps.state';
import {selectPerspective, selectQuery, selectViewCode} from '../navigation/navigation.state';
import {areQueriesEqual} from '../navigation/query/query.helper';
import {selectPivotConfig} from '../pivots/pivots.state';
import {selectTableConfig} from '../tables/tables.selector';
import {View, ViewGlobalConfig} from './view';
import {isViewConfigChanged} from './view.utils';
import {selectSearchConfig} from '../searches/searches.state';

export interface ViewsState extends EntityState<View> {
  loaded: boolean;
  globalConfig: ViewGlobalConfig;
}

export const viewsAdapter = createEntityAdapter<View>({selectId: view => view.id});

export const initialViewsState: ViewsState = viewsAdapter.getInitialState({
  loaded: false,
  globalConfig: {},
});

export const selectViewsState = (state: AppState) => state.views;

export const selectAllViews = createSelector(
  selectViewsState,
  viewsAdapter.getSelectors().selectAll
);
export const selectViewsDictionary = createSelector(
  selectViewsState,
  viewsAdapter.getSelectors().selectEntities
);
export const selectViewByCode = (code: string) =>
  createSelector(
    selectAllViews,
    views => views && views.find(view => view.code === code)
  );
export const selectCurrentView = createSelector(
  selectViewCode,
  selectAllViews,
  (viewCode, views) => (viewCode ? views.find(view => view.code === viewCode) : null)
);

export const selectViewsLoaded = createSelector(
  selectViewsState,
  state => state.loaded
);

const selectConfigs = createSelector(
  selectTableConfig,
  selectChartConfig,
  selectMapConfig,
  selectGanttChartConfig,
  selectCalendarConfig,
  selectKanbanConfig,
  selectPivotConfig,
  selectSearchConfig,
  (tableConfig, chartConfig, mapConfig, ganttChartConfig, calendarConfig, kanbanConfig, pivotConfig, searchConfig) => ({
    tableConfig,
    chartConfig,
    mapConfig,
    ganttChartConfig,
    calendarConfig,
    kanbanConfig,
    pivotConfig,
    searchConfig,
  })
);

export const selectPerspectiveConfig = createSelector(
  selectPerspective,
  selectConfigs,
  (
    perspective,
    {tableConfig, chartConfig, mapConfig, ganttChartConfig, calendarConfig, kanbanConfig, pivotConfig, searchConfig}
  ) =>
    ({
      [Perspective.Map]: mapConfig,
      [Perspective.Table]: tableConfig,
      [Perspective.Chart]: chartConfig,
      [Perspective.GanttChart]: ganttChartConfig,
      [Perspective.Calendar]: calendarConfig,
      [Perspective.Kanban]: kanbanConfig,
      [Perspective.Pivot]: pivotConfig,
      [Perspective.Search]: searchConfig,
    }[perspective])
);

export const selectPerspectiveViewConfig = createSelector(
  selectCurrentView,
  selectPerspective,
  (view, perspective) => view && view.config && view.config[perspective]
);
export const selectViewConfigChanged = createSelector(
  selectPerspective,
  selectPerspectiveConfig,
  selectPerspectiveViewConfig,
  selectDocumentsDictionary,
  selectCollectionsDictionary,
  selectLinkTypesDictionary,
  (perspective, perspectiveConfig, viewConfig, documentsMap, collectionsMap, linkTypesMap) =>
    viewConfig &&
    perspectiveConfig &&
    isViewConfigChanged(perspective, viewConfig, perspectiveConfig, documentsMap, collectionsMap, linkTypesMap)
);

export const selectViewQueryChanged = createSelector(
  selectCurrentView,
  selectQuery,
  (view, query) => view && query && !areQueriesEqual(view.query, query)
);

export const selectViewPerspectiveChanged = createSelector(
  selectCurrentView,
  selectPerspective,
  (view, perspective) => view && perspective && view.perspective !== perspective
);

const selectViewGlobalConfig = createSelector(
  selectViewsState,
  state => state.globalConfig
);

export const selectSidebarOpened = createSelector(
  selectViewGlobalConfig,
  config => config.sidebarOpened
);
