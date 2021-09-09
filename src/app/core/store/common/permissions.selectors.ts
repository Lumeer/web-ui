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
import {
  DocumentsAndLinksData,
  DocumentsAndLinksStemData,
  filterDocumentsAndLinksByQuery,
  filterDocumentsAndLinksDataByQuery,
  userCanReadDocument,
  userCanReadLinkInstance,
} from '@lumeer/data-filters';
import {containsSameElements, uniqueValues} from '../../../shared/utils/array.utils';
import {sortResourcesByFavoriteAndLastUsed} from '../../../shared/utils/resource.utils';
import {RoleType} from '../../model/role-type';
import {filterCollectionsByQuery} from '../collections/collections.filters';
import {
  selectAllCollections,
  selectCollectionById,
  selectCollectionsDictionary,
} from '../collections/collections.state';
import {DocumentModel} from '../documents/document.model';
import {
  filterTaskDocuments,
  groupDocumentsByCollection,
  sortDocumentsByCreationDate,
  sortDocumentsTasks,
} from '../documents/document.utils';
import {selectAllDocuments, selectDocumentsByCollectionId} from '../documents/documents.state';
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
import {groupLinkInstancesByLinkTypes, sortLinkInstances} from '../link-instances/link-instance.utils';
import {
  selectCollectionsPermissions,
  selectLinkTypesPermissions,
  selectResourcesPermissions,
  selectViewsPermissions,
} from '../user-permissions/user-permissions.state';
import {CollectionPurposeType} from '../collections/collection';
import {selectCurrentUserForWorkspace} from '../users/users.state';
import {getViewColor, getViewIcon} from '../views/view.utils';

const selectCollectionsByPermission = (roleTypes: RoleType[]) =>
  createSelector(selectCollectionsPermissions, selectAllCollections, (permissions, collections) =>
    collections.filter(collection => roleTypes.some(role => permissions?.[collection.id]?.rolesWithView?.[role]))
  );

export const selectReadableCollections = selectCollectionsByPermission([RoleType.Read]);

export const selectContributeCollections = selectCollectionsByPermission([RoleType.DataContribute]);

export const selectContributeAndWritableCollections = selectCollectionsByPermission([
  RoleType.DataContribute,
  RoleType.DataWrite,
]);

export const selectCollectionsByQuery = createSelector(
  selectReadableCollections,
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

const selectCollectionsByPurposeAndPermission = (purpose: CollectionPurposeType, role: RoleType) =>
  createSelector(selectCollectionsPermissions, selectAllCollections, (permissions, collections) =>
    collections.filter(
      collection => collection.purpose?.type === purpose && permissions?.[collection.id]?.rolesWithView?.[role]
    )
  );

const selectTasksCollectionsByReadPermission = selectCollectionsByPurposeAndPermission(
  CollectionPurposeType.Tasks,
  RoleType.Read
);

const selectLinkTypesByPermission = (roles: RoleType[]) =>
  createSelector(selectLinkTypesPermissions, selectAllLinkTypes, (permissions, linkTypes) =>
    linkTypes.filter(linkType => roles.some(role => permissions?.[linkType.id]?.rolesWithView?.[role]))
  );

export const selectReadableLinkTypes = selectLinkTypesByPermission([RoleType.Read]);

export const selectContributeLinkTypes = selectLinkTypesByPermission([RoleType.DataContribute]);

export const selectContributeAndWritableLinkTypes = selectLinkTypesByPermission([
  RoleType.DataWrite,
  RoleType.DataContribute,
]);

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
  selectReadableCollections,
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
    selectReadableCollections,
    selectAllDocuments,
    selectAllLinkTypes,
    selectConstraintData,
    (collections, documents, linkTypes, constraintData) =>
      filterCollectionsByQuery(collections, documents, linkTypes, query, constraintData)
  );

export const selectDocumentsByReadPermission = createSelector(
  selectAllDocuments,
  selectAllCollections,
  selectCollectionsPermissions,
  selectCurrentUserForWorkspace,
  selectConstraintData,
  (documents, collections, permissionsMap, currentUser, constraintData) => {
    const documentsByCollection = groupDocumentsByCollection(documents);
    return collections.reduce((allDocuments, collection) => {
      const permissions = permissionsMap[collection.id];
      const collectionDocuments = documentsByCollection[collection.id] || [];
      if (permissions?.rolesWithView?.DataRead) {
        allDocuments.push(...collectionDocuments);
      } else {
        allDocuments.push(
          ...collectionDocuments.filter(document =>
            userCanReadDocument(document, collection, permissions, currentUser, constraintData)
          )
        );
      }

      return allDocuments;
    }, []);
  }
);

export const selectLinksByReadPermission = createSelector(
  selectAllLinkInstances,
  selectAllLinkTypes,
  selectLinkTypesPermissions,
  selectCurrentUserForWorkspace,
  (linkInstances, linkTypes, permissionsMap, currentUser) => {
    const linkInstancesByLinkTypes = groupLinkInstancesByLinkTypes(linkInstances);
    return linkTypes.reduce((allLinkInstances, linkType) => {
      const permissions = permissionsMap[linkType.id];
      const collectionDocuments = linkInstancesByLinkTypes[linkType.id] || [];
      if (permissions?.rolesWithView?.DataRead) {
        allLinkInstances.push(...collectionDocuments);
      } else {
        allLinkInstances.push(
          ...collectionDocuments.filter(linkInstance =>
            userCanReadLinkInstance(linkInstance, linkType, permissions, currentUser)
          )
        );
      }

      return allLinkInstances;
    }, []);
  }
);

export const selectDocumentsAndLinksByQuery = createSelector(
  selectDocumentsByReadPermission,
  selectReadableCollections,
  selectReadableLinkTypes,
  selectLinksByReadPermission,
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

export const selectDataByQuery = createSelector(
  selectDocumentsByReadPermission,
  selectReadableCollections,
  selectReadableLinkTypes,
  selectLinksByReadPermission,
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
    includeSubItems
  ): DocumentsAndLinksData =>
    filterDocumentsAndLinksDataByQuery(
      documents,
      collections,
      linkTypes,
      linkInstances,
      query,
      permissions.collections,
      permissions.linkTypes,
      constraintData,
      includeSubItems
    )
);

export const selectDataByQuerySorted = createSelector(
  selectDataByQuery,
  selectAllCollections,
  selectAllLinkTypes,
  selectViewSettings,
  selectConstraintData,
  (data, collections, linkTypes, viewSettings, constraintData): DocumentsAndLinksData => {
    const collectionsMap = objectsByIdMap(collections);
    const linkTypesMap = objectsByIdMap(linkTypes);

    const dataByStemsSorted: DocumentsAndLinksStemData[] = (data.dataByStems || []).map(dataByStem => ({
      ...dataByStem,
      documents: sortDataResourcesByViewSettings(
        dataByStem.documents,
        collectionsMap,
        AttributesResourceType.Collection,
        viewSettings?.attributes,
        constraintData
      ),
      linkInstances: sortDataResourcesByViewSettings(
        dataByStem.linkInstances,
        linkTypesMap,
        AttributesResourceType.LinkType,
        viewSettings?.attributes,
        constraintData
      ),
    }));

    return {...data, dataByStems: dataByStemsSorted};
  }
);

export const selectDocumentsAndLinksByQuerySorted = createSelector(
  selectDocumentsByReadPermission,
  selectReadableCollections,
  selectReadableLinkTypes,
  selectLinksByReadPermission,
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
      query,
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
        viewSettings?.attributes,
        constraintData
      ),
      linkInstances: sortDataResourcesByViewSettings(
        data.linkInstances,
        linkTypesMap,
        AttributesResourceType.LinkType,
        viewSettings?.attributes,
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

export const selectDocumentsByQuery = createSelector(
  selectDocumentsAndLinksByQuery,
  (data): DocumentModel[] => data.documents
);

export const selectDocumentsByQueryAndIdsSortedByCreation = (ids: string[]) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectReadableCollections,
    selectReadableLinkTypes,
    selectLinksByReadPermission,
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

export const selectDocumentsByCollectionAndQuery = (collectionId: string, query: Query) =>
  createSelector(
    selectDocumentsByCollectionId(collectionId),
    selectCollectionById(collectionId),
    selectCollectionsPermissions,
    selectConstraintData,
    selectViewSettings,
    (documents, collection, permissions, constraintData, viewSettings) => {
      const data = filterDocumentsAndLinksByQuery(
        documents,
        [collection],
        [],
        [],
        query,
        permissions,
        {},
        constraintData
      );
      const collectionsMap = {[collectionId]: collection};
      return sortDataResourcesByViewSettings(
        data.documents,
        collectionsMap,
        AttributesResourceType.Collection,
        viewSettings?.attributes,
        constraintData
      );
    }
  );

const selectDocumentsAndLinksByCustomQuery = (query: Query, desc?: boolean) =>
  createSelector(
    selectDocumentsByReadPermission,
    selectReadableCollections,
    selectReadableLinkTypes,
    selectLinksByReadPermission,
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

export const selectLinkTypesInQuery = createSelector(selectReadableLinkTypes, selectViewQuery, (linkTypes, query) => {
  const linkTypesIdsInQuery = new Set(getAllLinkTypeIdsFromQuery(query));
  return linkTypes.filter(linkType => linkTypesIdsInQuery.has(linkType.id));
});

export const selectLinkTypesByCollectionId = (collectionId: string) =>
  createSelector(selectReadableLinkTypes, linkTypes =>
    linkTypes.filter(linkType => linkType.collectionIds.includes(collectionId))
  );

export const selectLinkTypesByCollectionIds = (collectionIds: string[]) =>
  createSelector(selectAllLinkTypes, linkTypes =>
    linkTypes.filter(linkType => containsSameElements(linkType.collectionIds, collectionIds))
  );

export const selectCanManageViewConfig = createSelector(
  selectCurrentView,
  selectViewsPermissions,
  (view, permissions) => !view || permissions?.[view.id]?.roles.PerspectiveConfig
);

export const selectCanChangeViewQuery = createSelector(
  selectCurrentView,
  selectViewsPermissions,
  (view, permissions) => !view || permissions?.[view.id]?.roles.QueryConfig
);

export const selectViewsByRead = createSelector(selectAllViews, selectViewsPermissions, (views, permissions) =>
  views.filter(view => permissions?.[view.id]?.roles?.Read)
);

export const selectViewsByReadSorted = createSelector(selectViewsByRead, (views): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(views)
);

export const selectViewsByReadWithComputedData = createSelector(selectViewsByRead, selectCollectionsDictionary,
  (views, collectionsMap) => views.map(view => ({...view, icon: getViewIcon(view), color: getViewColor(view, collectionsMap)})))

export const selectViewsByQuery = createSelector(selectViewsByRead, selectViewQuery, (views, query): View[] =>
  sortResourcesByFavoriteAndLastUsed<View>(filterViewsByQuery(views, query))
);
