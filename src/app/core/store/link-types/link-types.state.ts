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
import {LinkType} from './link.type';
import {selectCollectionsDictionary} from '../collections/collections.state';
import {mapLinkTypeCollections} from '../../../shared/utils/link-type.utils';

export interface LinkTypesState extends EntityState<LinkType> {
  loaded: boolean;
}

export const linkTypesAdapter = createEntityAdapter<LinkType>();

export const initialLinkTypesState: LinkTypesState = linkTypesAdapter.getInitialState({
  loaded: false,
});

export const selectLinkTypesState = (state: AppState) => state.linkTypes;

export const selectAllLinkTypes = createSelector(selectLinkTypesState, linkTypesAdapter.getSelectors().selectAll);

export const selectLinkTypesDictionary = createSelector(
  selectLinkTypesState,
  linkTypesAdapter.getSelectors().selectEntities
);
export const selectLinkTypesLoaded = createSelector(selectLinkTypesState, linkTypesState => linkTypesState.loaded);

export const selectLinkTypeById = (linkTypeId: string) =>
  createSelector(selectLinkTypesDictionary, linkTypes => linkTypes[linkTypeId]);

export const selectLinkTypeByIdWithCollections = (linkTypeId: string) =>
  createSelector(selectLinkTypesDictionary, selectCollectionsDictionary, (linkTypesMap, collectionsMap) => {
    const linkType = linkTypesMap[linkTypeId];
    return linkType ? mapLinkTypeCollections(linkType, collectionsMap) : linkType;
  });

export const selectLinkTypeAttributeById = (linkTypeId: string, attributeId: string) =>
  createSelector(selectLinkTypeById(linkTypeId), linkType =>
    linkType?.attributes?.find(attribute => attribute.id === attributeId)
  );
