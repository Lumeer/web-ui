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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {Perspective} from '../../../view/perspectives/perspective';
import {AppState} from '../app.state';
import {selectChartConfig} from '../charts/charts.state';
import {selectMapConfig} from '../maps/maps.state';
import {selectNavigation, selectPerspective, selectQuery} from '../navigation/navigation.state';
import {areQueriesEqual} from '../navigation/query.helper';
import {selectPostItConfig} from '../postit/postit.state';
import {selectTableConfig} from '../tables/tables.selector';
import {filterViewsByQuery, sortViewsById} from './view.filters';
import {ViewConfigModel, ViewCursor, ViewModel} from './view.model';
import {areConfigsEqual} from './view.utils';

export interface ViewsState extends EntityState<ViewModel> {
  loaded: boolean;
  config: ViewConfigModel;
  cursor: ViewCursor;
}

export const viewsAdapter = createEntityAdapter<ViewModel>({selectId: view => view.code});

export const initialViewsState: ViewsState = viewsAdapter.getInitialState({
  loaded: false,
  config: {},
  cursor: null,
});

export const selectViewsState = (state: AppState) => state.views;

export const selectAllViews = createSelector(selectViewsState, viewsAdapter.getSelectors().selectAll);
export const selectViewsDictionary = createSelector(selectViewsState, viewsAdapter.getSelectors().selectEntities);
export const selectViewByCode = (code: string) => createSelector(selectViewsDictionary, viewsMap => viewsMap[code]);
export const selectCurrentView = createSelector(selectNavigation, selectViewsDictionary, (navigation, viewsMap) => {
  return navigation.workspace && navigation.workspace.viewCode ? viewsMap[navigation.workspace.viewCode] : null;
});

export const selectViewsLoaded = createSelector(selectViewsState, state => state.loaded);

export const selectViewConfig = createSelector(selectViewsState, views => views.config);
export const selectViewSearchConfig = createSelector(selectViewConfig, config => config.search);
export const selectViewTableConfig = createSelector(selectViewConfig, config => config.table);
export const selectViewsByQuery = createSelector(
  selectAllViews,
  selectQuery,
  (views, query): ViewModel[] => sortViewsById(filterViewsByQuery(views, query))
);

export const selectViewCursor = createSelector(selectViewsState, state => state.cursor);

export const selectPerspectiveConfig = createSelector(
  selectPerspective,
  selectPostItConfig,
  selectTableConfig,
  selectChartConfig,
  selectMapConfig,
  (perspective, postItConfig, tableConfig, chartConfig, mapConfig) =>
    ({
      [Perspective.Map]: mapConfig,
      [Perspective.PostIt]: postItConfig,
      [Perspective.Table]: tableConfig,
      [Perspective.Chart]: chartConfig,
    }[perspective])
);
export const selectPerspectiveViewConfig = createSelector(
  selectCurrentView,
  selectPerspective,
  (view, perspective) => view && view.config && view.config[perspective]
);
export const selectViewConfigChanged = createSelector(
  selectPerspectiveConfig,
  selectPerspectiveViewConfig,
  (perspectiveConfig, viewConfig) => perspectiveConfig && viewConfig && !areConfigsEqual(perspectiveConfig, viewConfig)
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
