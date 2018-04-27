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
import {AppState} from '../app.state';
import {selectQuery} from '../navigation/navigation.state';
import {ViewConfigModel, ViewModel} from './view.model';
import {ViewFilters} from "./view.filters";

export interface ViewsState extends EntityState<ViewModel> {

  loaded: boolean;
  config: ViewConfigModel;

}

export const viewsAdapter = createEntityAdapter<ViewModel>({selectId: view => view.code});

export const initialViewsState: ViewsState = viewsAdapter.getInitialState({
  loaded: false,
  config: {}
});

export const selectViewsState = (state: AppState) => state.views;

export const selectAllViews = createSelector(selectViewsState, viewsAdapter.getSelectors().selectAll);
export const selectViewsDictionary = createSelector(selectViewsState, viewsAdapter.getSelectors().selectEntities);
export const selectViewByCode = (code: string) => createSelector(selectViewsDictionary, viewsMap => viewsMap[code]);

export const selectViewsLoaded = createSelector(selectViewsState, state => state.loaded);

export const selectViewConfig = createSelector(selectViewsState, views => views.config);
export const selectViewSearchConfig = createSelector(selectViewConfig, config => config.search);
export const selectViewSmartDocConfig = createSelector(selectViewConfig, config => config.smartdoc);
export const selectViewPostItConfig = createSelector(selectViewConfig, config => config.postit);
export const selectViewTableConfig = createSelector(selectViewConfig, config => config.table);
export const selectViewTable2Config = createSelector(selectViewConfig, config => config.table2);
export const selectViewsByQuery = createSelector(selectAllViews, selectQuery, (views, query): ViewModel[] => ViewFilters.filterByQuery(views, query));
