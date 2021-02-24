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
import {AppState} from '../app.state';
import {MapImageData, MapImageLoadResult, MapModel} from './map.model';
import {selectWorkspace} from '../navigation/navigation.state';
import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';

export interface MapsState extends EntityState<MapModel> {
  imagesCache: Record<string, MapImageData>;
  imagesLoading: string[];
  imagesLoaded: Record<string, MapImageLoadResult>;
}

export const mapsAdapter = createEntityAdapter<MapModel>({selectId: map => map.id});

export const initialMapsState: MapsState = mapsAdapter.getInitialState({
  imagesCache: {},
  imagesLoading: [],
  imagesLoaded: {},
});

export const selectMapsState = (state: AppState) => state.maps;

export const selectMapsDictionary = createSelector(selectMapsState, mapsAdapter.getSelectors().selectEntities);
export const selectMapById = (mapId: string) => createSelector(selectMapsDictionary, maps => maps[mapId]);

export const selectMapId = createSelector(selectWorkspace, workspace => workspace?.viewCode || DEFAULT_PERSPECTIVE_ID);

export const selectMap = createSelector(selectMapsDictionary, selectMapId, (maps, mapId) => maps[mapId]);

export const selectMapConfig = createSelector(selectMap, map => map?.config);

export const selectMapImageData = (url: string) => createSelector(selectMapsState, state => state.imagesCache[url]);

export const selectMapImageDataLoading = (url: string) =>
  createSelector(selectMapsState, state => state.imagesLoading.includes(url));

export const selectMapImageDataLoaded = (url: string) =>
  createSelector(selectMapsState, state => state.imagesLoaded[url]);
