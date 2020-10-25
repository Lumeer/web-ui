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
import {isArraySubset, uniqueValues} from '../../../shared/utils/array.utils';
import {
  authorHasRoleInView,
  sortResourcesByFavoriteAndLastUsed,
  userHasRoleInResource,
  userIsManagerInWorkspace,
} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {selectAllCollections, selectCollectionsDictionary} from '../collections/collections.state';
import {DocumentModel} from '../documents/document.model';
import {sortDocumentsByCreationDate} from '../documents/document.utils';
import {filterDocumentsAndLinksByQuery} from '../documents/documents.filters';
import {selectAllDocuments} from '../documents/documents.state';
import {selectAllLinkInstances} from '../link-instances/link-instances.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {selectQuery} from '../navigation/navigation.state';
import {Query} from '../navigation/query/query';
import {
  getAllCollectionIdsFromQuery,
  getAllLinkTypeIdsFromQuery,
  queryWithoutLinks,
} from '../navigation/query/query.util';
import {selectCurrentUser} from '../users/users.state';
import {View} from '../views/view';
import {filterViewsByQuery} from '../views/view.filters';
import {selectAllViews, selectCurrentView} from '../views/views.state';
import {selectWorkspaceModels} from './common.selectors';
import {LinkInstance} from '../link-instances/link.instance';
import {sortLinkInstances} from '../link-instances/link-instance.utils';
import {selectConstraintData} from '../constraint-data/constraint-data.state';
import {selectViewSettings} from '../view-settings/view-settings.state';
import {objectsByIdMap} from '../../../shared/utils/common.utils';
import {AttributesResourceType} from '../../model/resource';
import {sortDataResourcesByViewSettings} from '../../../shared/utils/data-resource.utils';

export const selectCurrentUserIsManager = createSelector(
  selectCurrentUser,
  selectWorkspaceModels,
  (user, workspace) => {
    const {organization, project} = workspace;
    return userIsManagerInWorkspace(user, organization, project);
  }
);

const selectCollectionsByPermission = (role: Role) =>
  createSelector(
    selectCurrentUserIsManager,
    selectAllCollections,
    selectAllLinkTypes,
    selectCurrentView,
    selectCurrentUser,
    (isManager, collections, linkTypes, view, user) => {
      if (isManager) {
        return collections;
      }
      const collectionIdsFromView = view && getAllCollectionIdsFromQuery(view.query, linkTypes);
      return collections.filter(
        collection =>
          userHasRoleInResource(user, collection, role) ||
          (collectionIdsFromView &&
            collectionIdsFromView.includes(collection.id) &&
            userHasRoleInResource(user, view, role) &&
            authorHasRoleInView(view, collection.id, role))
      );
    }
  );

export const selectCollectionsByReadPermission = selectCollectionsByPermission(Role.Read);

export const selectCollectionsByWritePermission = selectCollectionsByPermission(Role.Write);

export const selectCollectionsByQuery = createSelector(
  selectCollectionsByReadPermission,
  selectAllDocuments,
  selectAllLinkTypes,
  selectQuery,
  selectConstraintData,
  (collections, documents, linkTypes, query, constraintData) =>
    filterCollectionsByQuery(collections, documents, linkTypes, query, constraintData)
);

export const selectCollectionsByQueryWithoutLinks = createSelector(
  selectCollectionsByReadPermission,
  selectAllDocuments,
  selectAllLinkTypes,
  selectQuery,
  selectConstraintData,
  (collections, documents, linkTypes, query, constraintData) =>
    filterCollectionsByQuery(collections, documents, linkTypes, queryWithoutLinks(query), constraintData)
);

export const selectCollectionsInQuery = createSelector(
  selectCollectionsDictionary,
  selectQuery,
  (collectionsMap, query) => {
    const collectionIds = uniqueValues(query?.stems?.map(stem => stem.collectionId) || []);
    return collectionIds.map(id => collectionsMap[id]).filter(collection => !!collection);
  }
);

export const selectCollectionsByStems = createSelector(
  selectCollectionsDictionary,
  selectAllLinkTypes,
  selectQuery,
  (collectionsMap, linkTypes, query) => {
    const collectionIds = getAllCollectionIdsFromQuery(query, linkTypes);
    return collectionIds.map(id => collectionsMap[id]).filter(collection => !!collection);
  }
);

export const selectCollectionsByCustomQuery = (query: Query) =>
  createSelector(
    selectCollectionsByReadPermission,
    selectAllDocuments,
    selectAllLinkTypes,
    selectConstraintData,
    (collections, documents, linkTypes, constraintData) =>
      filterCollectionsByQuery(collections, documents, linkTypes, query, constraintData)
  );

export const selectDocumentsByReadPermission = createSelector(
  selectAllDocuments,
  selectCollectionsByReadPermission,
  (documents, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return documents.filter(document => allowedCollectionIds.includes(document.collectionId));
  }
);

export const selectDocumentsAndLinksByQuery = createSelector(
  selectDocumentsByReadPermission,
  selectCollectionsByReadPermission,
  selectAllLinkTypes,
  selectAllLinkInstances,
  selectQuery,
  selectViewSettings,
  selectConstraintData,
  (
    documents,
    collections,
    linkTypes,
    linkInstances,
    query,
    viewSettings,
    constraintData
  ): {documents: DocumentModel[]; linkInstances: LinkInstance[]} => {
    const data = filterDocumentsAndLinksByQuery(
      documents,
      collections,
      linkTypes,
      linkInstances,
      query,
      constraintData
    );
    const collectionsMap = objectsByIdMap(collections);
    const linkTypesMap = objectsByIdMap(linkTypes);
    return {
      documents: sortDataResourcesByViewSettings(
        data.documents,
        collectionsMap,
        AttributesResourceType.Collection,
        viewSettings,
        constraintData
      ),
      linkInstances: sortDataResourcesByViewSettings(
        data.linkInstances,
        linkTypesMap,
        AttributesResourceType.LinkType,
        viewSettings,
        constraintData
      ),
    };
  }
);

export const selectDocumentsByQuery = createSelector(
  selectDocumentsAndLinksByQuery,
  (data): DocumentModel[] => data.documents
);

export const selectDocumentsByQuerySorted = createSelector(
  selectDocumentsByQuery,
  selectCollectionsDictionary,
  selectViewSettings,
  selectConstraintData,
  (documents, collectionsMap, viewSettings, constraintData) =>
    sortDataResourcesByViewSettings(
      documents,
      collectionsMap,
      AttributesResourceType.Collection,
      viewSettings,
      constraintData
    )
);

export const selectDocumentsByQueryIncludingChildren = createSelector(
  selectDocumentsByReadPermission,
  selectCollectionsByReadPermission,
  selectAllLinkTypes,
  selectAllLinkInstances,
  selectQuery,
  selectConstraintData,
  (documents, collections, linkTypes, linkInstances, query, constraintData): DocumentModel[] =>
    sortDocumentsByCreationDate(
      filterDocumentsAndLinksByQuery(documents, collections, linkTypes, linkInstances, query, constraintData, true)
        .documents
    )
);

export const selectDocumentsByQueryIncludingChildrenAndIds = (ids: string[]) =>
  createSelector(selectDocumentsByQueryIncludingChildren, documents => documents.filter(doc => ids.includes(doc.id)));

export const selectDocumentsAndLinksByCustomQuery = (query: Query, desc?: boolean, includeChildren?: boolean) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectCollectionsByReadPermission,
    selectAllLinkTypes,
    selectAllLinkInstances,
    selectViewSettings,
    selectConstraintData,
    (documents, collections, linkTypes, linkInstances, viewSettings, constraintData) => {
      const data = filterDocumentsAndLinksByQuery(
        documents,
        collections,
        linkTypes,
        linkInstances,
        query,
        constraintData,
        includeChildren
      );
      const collectionsMap = objectsByIdMap(collections);
      const linkTypesMap = objectsByIdMap(linkTypes);
      return {
        documents: sortDataResourcesByViewSettings(
          data.documents,
          collectionsMap,
          AttributesResourceType.Collection,
          viewSettings,
          constraintData
        ),
        linkInstances: sortDataResourcesByViewSettings(
          data.linkInstances,
          linkTypesMap,
          AttributesResourceType.LinkType,
          viewSettings,
          constraintData
        ),
      };
    }
  );

export const selectDocumentsByCustomQuery = (query: Query, desc?: boolean, includeChildren?: boolean) =>
  createSelector(selectDocumentsAndLinksByCustomQuery(query, desc, includeChildren), data => data.documents);

export const selectLinkTypesByReadPermission = createSelector(
  selectAllLinkTypes,
  selectCollectionsByReadPermission,
  (linkTypes, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
  }
);

export const selectLinkTypesInQuery = createSelector(
  selectLinkTypesByReadPermission,
  selectQuery,
  (linkTypes, query) => {
    const linkTypesIdsInQuery = getAllLinkTypeIdsFromQuery(query);
    return linkTypes.filter(linkType => linkTypesIdsInQuery.includes(linkType.id));
  }
);

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(selectLinkTypesByReadPermission, linkTypes =>
    linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId))
  );

export const selectViewsByRead = createSelector(
  selectAllViews,
  selectCurrentUser,
  selectCurrentUserIsManager,
  (views, user, isManager) => (isManager && views) || views.filter(view => userHasRoleInResource(user, view, Role.Read))
);

export const selectViewsByReadSorted = createSelector(selectViewsByRead, (views): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(views)
);

export const selectViewsByQuery = createSelector(selectViewsByRead, selectQuery, (views, query): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(filterViewsByQuery(views, query))
);
