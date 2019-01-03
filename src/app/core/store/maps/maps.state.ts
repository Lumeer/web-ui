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
import {MapModel} from './map.model';

export const DEFAULT_MAP_ID = 'default';

export interface MapsState extends EntityState<MapModel> {}

export const mapsAdapter = createEntityAdapter<MapModel>({selectId: map => map.id});

export const initialMapsState = mapsAdapter.getInitialState();

export const selectMapsState = (state: AppState) => state.maps;

export const selectMapsDictionary = createSelector(
  selectMapsState,
  mapsAdapter.getSelectors().selectEntities
);
export const selectMapById = (mapId: string) =>
  createSelector(
    selectMapsDictionary,
    maps => maps[mapId]
  );
export const selectMapConfigById = (mapId: string) =>
  createSelector(
    selectMapById(mapId),
    map => map && map.config
  );

export const selectDefaultMap = selectMapById(DEFAULT_MAP_ID);
export const selectMapConfig = selectMapConfigById(DEFAULT_MAP_ID);
