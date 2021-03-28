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
import {filterDocumentsAndLinksByQuery} from '@lumeer/data-filters';
import {containsSameElements, isArraySubset, uniqueValues} from '../../../shared/utils/array.utils';
import {hasRoleByPermissions, sortResourcesByFavoriteAndLastUsed} from '../../../shared/utils/resource.utils';
import {Role} from '../../model/role';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {selectAllCollections, selectCollectionsDictionary} from '../collections/collections.state';
import {DocumentModel} from '../documents/document.model';
import {filterTaskDocuments, sortDocumentsByCreationDate, sortDocumentsTasks} from '../documents/document.utils';
import {selectAllDocuments} from '../documents/documents.state';
import {selectAllLinkInstances} from '../link-instances/link-instances.state';
import {selectAllLinkTypes} from '../link-types/link-types.state';
import {Query} from '../navigation/query/query';
import {
  checkTasksCollectionsQuery,
  getAllCollectionIdsFromQuery,
  getAllLinkTypeIdsFromQuery,
  queryIsEmpty,
  queryWithoutLinks,
  tasksCollectionsQuery,
} from '../navigation/query/query.util';
import {View} from '../views/view';
import {filterViewsByQuery} from '../views/view.filters';
import {selectAllViews, selectCurrentView, selectViewQuery} from '../views/views.state';
import {LinkInstance} from '../link-instances/link.instance';
import {selectConstraintData} from '../constraint-data/constraint-data.state';
import {
  selectDataSettingsIncludeSubItems,
  selectViewDataQuery,
  selectViewSettings,
} from '../view-settings/view-settings.state';
import {objectsByIdMap} from '../../../shared/utils/common.utils';
import {AttributesResourceType} from '../../model/resource';
import {sortDataResourcesByViewSettings} from '../../../shared/utils/data-resource.utils';
import {sortLinkInstances} from '../link-instances/link-instance.utils';
import {
  selectCollectionsPermissions,
  selectResourcesPermissions,
  selectViewsPermissions,
} from '../user-permissions/user-permissions.state';
import {CollectionPurposeType} from '../collections/collection';

const selectCollectionsByPermission = (role: Role) =>
  createSelector(selectCollectionsPermissions, selectAllCollections, (permissions, collections) =>
    collections.filter(collection => hasRoleByPermissions(role, permissions[collection.id]))
  );

export const selectCollectionsByReadPermission = selectCollectionsByPermission(Role.Read);

export const selectCollectionsByWritePermission = selectCollectionsByPermission(Role.Write);

export const selectCollectionsByQuery = createSelector(
  selectCollectionsByReadPermission,
  selectAllDocuments,
  selectAllLinkTypes,
  selectViewQuery,
  selectConstraintData,
  (collections, documents, linkTypes, query, constraintData) =>
    filterCollectionsByQuery(collections, documents, linkTypes, query, constraintData)
);

export const selectTasksCollections = createSelector(selectAllCollections, collections =>
  collections.filter(collection => collection.purpose?.type === CollectionPurposeType.Tasks)
);

const selectCollectionsByPurposeAndPermission = (purpose: CollectionPurposeType, role: Role) =>
  createSelector(selectCollectionsPermissions, selectAllCollections, (permissions, collections) =>
    collections.filter(
      collection => collection.purpose?.type === purpose && hasRoleByPermissions(role, permissions[collection.id])
    )
  );

const selectTasksCollectionsByReadPermission = selectCollectionsByPurposeAndPermission(
  CollectionPurposeType.Tasks,
  Role.Read
);

export const selectTasksQuery = createSelector(
  selectViewQuery,
  selectTasksCollectionsByReadPermission,
  (query, collections) => checkTasksCollectionsQuery(collections, query, {})
);

export const selectTasksCollectionsByQuery = createSelector(
  selectTasksCollections,
  selectAllDocuments,
  selectAllLinkTypes,
  selectViewQuery,
  selectCollectionsPermissions,
  selectConstraintData,
  (collections, documents, linkTypes, query, permissions, constraintData) =>
    filterCollectionsByQuery(
      collections,
      documents,
      linkTypes,
      checkTasksCollectionsQuery(collections, query, permissions),
      constraintData
    )
);

export const selectCollectionsByQueryWithoutLinks = createSelector(
  selectCollectionsByReadPermission,
  selectAllDocuments,
  selectAllLinkTypes,
  selectViewQuery,
  selectConstraintData,
  (collections, documents, linkTypes, query, constraintData) =>
    filterCollectionsByQuery(collections, documents, linkTypes, queryWithoutLinks(query), constraintData)
);

export const selectCollectionsInQuery = createSelector(
  selectCollectionsDictionary,
  selectViewQuery,
  (collectionsMap, query) => {
    const collectionIds = uniqueValues(query?.stems?.map(stem => stem.collectionId) || []);
    return collectionIds.map(id => collectionsMap[id]).filter(collection => !!collection);
  }
);

export const selectCollectionsByStems = createSelector(
  selectCollectionsDictionary,
  selectAllLinkTypes,
  selectViewQuery,
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
    const allowedCollectionIds = new Set(collections.map(collection => collection.id));
    return documents.filter(document => allowedCollectionIds.has(document.collectionId));
  }
);

export const selectDocumentsAndLinksByQuery = createSelector(
  selectDocumentsByReadPermission,
  selectCollectionsByReadPermission,
  selectAllLinkTypes,
  selectAllLinkInstances,
  selectViewQuery,
  selectResourcesPermissions,
  selectConstraintData,
  selectDataSettingsIncludeSubItems,
  (
    documents,
    collections,
    linkTypes,
    linkInstances,
    query,
    permissions,
    constraintData,
    includeChildren
  ): {documents: DocumentModel[]; linkInstances: LinkInstance[]} =>
    filterDocumentsAndLinksByQuery(
      documents,
      collections,
      linkTypes,
      linkInstances,
      query,
      permissions.collections,
      permissions.linkTypes,
      constraintData,
      includeChildren
    )
);

export const selectDocumentsAndLinksByCustomQuerySorted = (inputQuery?: Query) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectCollectionsByReadPermission,
    selectAllLinkTypes,
    selectAllLinkInstances,
    selectViewQuery,
    selectViewSettings,
    selectResourcesPermissions,
    selectConstraintData,
    (
      documents,
      collections,
      linkTypes,
      linkInstances,
      query,
      viewSettings,
      permissions,
      constraintData
    ): {documents: DocumentModel[]; linkInstances: LinkInstance[]} => {
      const data = filterDocumentsAndLinksByQuery(
        documents,
        collections,
        linkTypes,
        linkInstances,
        inputQuery || query,
        permissions.collections,
        permissions.linkTypes,
        constraintData,
        viewSettings?.data?.includeSubItems
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

export const selectTasksDocumentsByQuery = createSelector(
  selectAllDocuments,
  selectTasksCollectionsByQuery,
  selectAllLinkTypes,
  selectAllLinkInstances,
  selectViewDataQuery,
  selectResourcesPermissions,
  selectConstraintData,
  (documents, collections, linkTypes, linkInstances, query, permissions, constraintData): DocumentModel[] => {
    let tasksDocuments = documents;
    let tasksQuery: Query = query;

    if (queryIsEmpty(query)) {
      tasksDocuments = filterTaskDocuments(documents, collections, constraintData);
      tasksQuery = tasksCollectionsQuery(collections, permissions.collections);
    }

    const filteredTasks = filterDocumentsAndLinksByQuery(
      tasksDocuments,
      collections,
      linkTypes,
      linkInstances,
      tasksQuery,
      permissions.collections,
      permissions.linkTypes,
      constraintData,
      query?.includeSubItems
    ).documents;

    return sortDocumentsTasks(filteredTasks, collections);
  }
);

export const selectDocumentsAndLinksByQuerySorted = selectDocumentsAndLinksByCustomQuerySorted();

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

export const selectDocumentsByQueryAndIdsSortedByCreation = (ids: string[]) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectCollectionsByReadPermission,
    selectAllLinkTypes,
    selectAllLinkInstances,
    selectViewQuery,
    selectResourcesPermissions,
    selectConstraintData,
    (documents, collections, linkTypes, linkInstances, query, permissions, constraintData): DocumentModel[] =>
      sortDocumentsByCreationDate(
        filterDocumentsAndLinksByQuery(
          documents,
          collections,
          linkTypes,
          linkInstances,
          query,
          permissions.collections,
          permissions.linkTypes,
          constraintData
        ).documents.filter(doc => ids.includes(doc.id))
      )
  );

const selectDocumentsAndLinksByCustomQuery = (query: Query, desc?: boolean) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectCollectionsByReadPermission,
    selectAllLinkTypes,
    selectAllLinkInstances,
    selectResourcesPermissions,
    selectConstraintData,
    selectDataSettingsIncludeSubItems,
    (documents, collections, linkTypes, linkInstances, permissions, constraintData, includeChildren) => {
      const data = filterDocumentsAndLinksByQuery(
        documents,
        collections,
        linkTypes,
        linkInstances,
        query,
        permissions.collections,
        permissions.linkTypes,
        constraintData,
        includeChildren
      );
      return {
        documents: sortDocumentsByCreationDate(data.documents, desc),
        linkInstances: sortLinkInstances(data.linkInstances),
      };
    }
  );

export const selectDocumentsByCustomQuery = (query: Query, desc?: boolean) =>
  createSelector(selectDocumentsAndLinksByCustomQuery(query, desc), data => data.documents);

export const selectLinkTypesByReadPermission = createSelector(
  selectAllLinkTypes,
  selectCollectionsByReadPermission,
  (linkTypes, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
  }
);

export const selectLinkTypesByWritePermission = createSelector(
  selectAllLinkTypes,
  selectCollectionsByWritePermission,
  (linkTypes, collections) => {
    const allowedCollectionIds = collections.map(collection => collection.id);
    return linkTypes.filter(linkType => isArraySubset(allowedCollectionIds, linkType.collectionIds));
  }
);

export const selectLinkTypesInQuery = createSelector(
  selectLinkTypesByReadPermission,
  selectViewQuery,
  (linkTypes, query) => {
    const linkTypesIdsInQuery = new Set(getAllLinkTypeIdsFromQuery(query));
    return linkTypes.filter(linkType => linkTypesIdsInQuery.has(linkType.id));
  }
);

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(selectLinkTypesByReadPermission, linkTypes =>
    linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId))
  );

export const selectLinkTypesByCollectionIds = (collectionIds: string[]) =>
  createSelector(selectLinkTypesByReadPermission, linkTypes =>
    linkTypes.filter(linkType => containsSameElements(linkType.collectionIds, collectionIds))
  );

export const selectCanManageViewConfig = createSelector(
  selectCurrentView,
  selectViewsPermissions,
  (view, permissions) => !view || permissions?.[view.id]?.manage
);

export const selectViewsByRead = createSelector(selectAllViews, selectViewsPermissions, (views, permissions) =>
  views.filter(view => permissions?.[view.id]?.read)
);

export const selectViewsByReadSorted = createSelector(selectViewsByRead, (views): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(views)
);

export const selectViewsByQuery = createSelector(selectViewsByRead, selectViewQuery, (views, query): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(filterViewsByQuery(views, query))
);
