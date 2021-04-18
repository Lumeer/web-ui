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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {selectWorkspace} from '../navigation/navigation.state';
import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';
import {Detail} from './detail';
import {QueryStem} from '../navigation/query/query';
import {queryStemsAreSame} from '../navigation/query/query.util';

export interface DetailsState extends EntityState<Detail> {}

export const detailsAdapter = createEntityAdapter<Detail>({selectId: detail => detail.id});

export const initialDetailsState: DetailsState = detailsAdapter.getInitialState();

export const selectDetailsState = (state: AppState) => state.details;
export const selectDetailsDictionary = createSelector(selectDetailsState, detailsAdapter.getSelectors().selectEntities);
export const selectDetailById = id => createSelector(selectDetailsDictionary, details => details[id]);

export const selectDetailId = createSelector(
  selectWorkspace,
  workspace => workspace?.viewCode || DEFAULT_PERSPECTIVE_ID
);

export const selectDetail = createSelector(selectDetailsDictionary, selectDetailId, (map, id) => map[id]);
export const selectDetailConfig = createSelector(selectDetail, detail => detail?.config);

export const selectDetailAttributesSettings = (stem: QueryStem) =>
  createSelector(
    selectDetailConfig,
    config =>
      stem && config?.stemsConfigs?.find(stemConfig => queryStemsAreSame(stem, stemConfig.stem))?.attributesSettings
  );
