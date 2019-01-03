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
import {selectLinkTypeById} from '../link-types/link-types.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {CollectionModel} from './collection.model';

export interface CollectionsState extends EntityState<CollectionModel> {
  loaded: boolean;
}

export const collectionsAdapter = createEntityAdapter<CollectionModel>({selectId: collection => collection.id});

export const initialCollectionsState: CollectionsState = collectionsAdapter.getInitialState({
  loaded: false,
});

export const selectCollectionsState = (state: AppState) => state.collections;

export const selectAllCollections = createSelector(
  selectCollectionsState,
  collectionsAdapter.getSelectors().selectAll
);
export const selectCollectionsDictionary = createSelector(
  selectCollectionsState,
  collectionsAdapter.getSelectors().selectEntities
);
export const selectCollectionsLoaded = createSelector(
  selectCollectionsState,
  (state: CollectionsState) => state.loaded
);

export const selectCollectionByWorkspace = createSelector(
  selectCollectionsDictionary,
  selectWorkspace,
  (collections, workspace) => {
    return workspace && workspace.collectionId ? collections[workspace.collectionId] : null;
  }
);

export const selectCollectionById = (id: string) =>
  createSelector(
    selectCollectionsDictionary,
    collectionsDictionary => collectionsDictionary[id]
  );

export const selectCollectionsByIds = (ids: string[]) =>
  createSelector(
    selectCollectionsDictionary,
    collectionsDictionary => ids.map(id => collectionsDictionary[id])
  );

export const selectCollectionsByLinkType = (linkTypeId: string) =>
  createSelector(
    selectCollectionsDictionary,
    selectLinkTypeById(linkTypeId),
    (collectionsMap, linkType) => {
      return (linkType && linkType.collectionIds.map(id => collectionsMap[id])) || [];
    }
  );
