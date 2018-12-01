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

import {isNullOrUndefined} from 'util';
import {UserModel} from '../users/user.model';
import {DocumentModel} from './document.model';
import {groupDocumentsByCollection, mergeDocuments} from './document.utils';
import {AttributeFilterModel, ConditionType, QueryModel, QueryStemModel} from '../navigation/query.model';
import {conditionFromString, isOnlyFulltextsQuery, queryIsEmptyExceptPagination} from '../navigation/query.util';
import {CollectionModel} from '../collections/collection.model';
import {LinkTypeModel} from '../link-types/link-type.model';
import {LinkInstanceModel} from '../link-instances/link-instance.model';
import {getOtherLinkedCollectionId} from '../../../shared/utils/link-type.utils';
import {arrayIntersection} from '../../../shared/utils/array.utils';

export function filterDocumentsByQuery(
  documents: DocumentModel[],
  collections: CollectionModel[],
  linkTypes: LinkTypeModel[],
  linkInstances: LinkInstanceModel[],
  query: QueryModel,
  currentUser: UserModel,
  includeChildren?: boolean
): DocumentModel[] {
  const filteredDocuments = documents.filter(document => document && typeof document === 'object');

  if (!query || queryIsEmptyExceptPagination(query)) {
    return paginate(filteredDocuments, query);
  }

  let documentsByStems: DocumentModel[] = [];

  const documentsByCollectionsMap = groupDocumentsByCollection(filteredDocuments);
  const queryWithFunctions = applyFunctionsToFilters(query, currentUser);

  if (isOnlyFulltextsQuery(queryWithFunctions)) {
    collections.forEach(collection => {
      const documentsByCollection = filterDocumentsByFulltexts(
        documentsByCollectionsMap[collection.id] || [],
        collection,
        queryWithFunctions.fulltexts
      );
      if (includeChildren) {
        documentsByStems.push(
          ...getDocumentsWithChildren(documentsByCollection, documentsByCollectionsMap[collection.id] || [])
        );
      } else {
        documentsByStems.push(...documentsByCollection);
      }
    });
  } else if (queryWithFunctions.stems) {
    queryWithFunctions.stems.forEach(stem => {
      const documentsByStem = filterDocumentsByStem(
        documentsByCollectionsMap,
        collections,
        linkTypes,
        linkInstances,
        stem,
        queryWithFunctions.fulltexts,
        includeChildren
      );
      documentsByStems = mergeDocuments(documentsByStems, documentsByStem);
    });
  }

  return paginate(documentsByStems, queryWithFunctions);
}

function applyFunctionsToFilters(query: QueryModel, currentUser: UserModel): QueryModel {
  const stems =
    query.stems &&
    query.stems.map(stem => {
      const filters =
        stem.filters &&
        stem.filters.map(filter => {
          const value = applyFilterFunctions(filter, currentUser);
          return {...filter, value};
        });
      return {...stem, filters};
    });
  return {...query, stems};
}

function applyFilterFunctions(filter: AttributeFilterModel, currentUser: UserModel): any {
  switch (filter.value) {
    case 'userEmail()':
      return currentUser && currentUser.email;
    default:
      return filter.value;
  }
}

function getDocumentsWithChildren(currentDocuments: DocumentModel[], allDocuments: DocumentModel[]): DocumentModel[] {
  const documentsWithChildren = currentDocuments;
  const currentDocumentsIds = new Set(currentDocuments.map(doc => doc.id));
  const documentsToSearch = allDocuments.filter(document => !currentDocumentsIds.has(document.id));
  let foundParent = true;
  while (foundParent) {
    foundParent = false;
    for (const document of documentsToSearch) {
      if (document.metaData && currentDocumentsIds.has(document.metaData.parentId)) {
        documentsWithChildren.push(document);
        currentDocumentsIds.add(document.id);
        foundParent = true;
      }
    }
  }

  return documentsWithChildren;
}

function filterDocumentsByStem(
  documentsByCollectionMap: {[collectionId: string]: [DocumentModel]},
  collections: CollectionModel[],
  linkTypes: LinkTypeModel[],
  linkInstances: LinkInstanceModel[],
  stem: QueryStemModel,
  fulltexts: string[],
  includeChildren?: boolean
): DocumentModel[] {
  const baseCollection = collections.find(collection => collection.id === stem.collectionId);
  if (!baseCollection) {
    return [];
  }

  const baseStem = cleanStemForBaseCollection(stem, documentsByCollectionMap[stem.collectionId] || []);
  const stemsPipeline = createStemsPipeline(stem, collections, linkTypes, documentsByCollectionMap);

  const documentsByBaseStem = filterDocumentsByAllConditions(
    documentsByCollectionMap[baseCollection.id] || [],
    baseCollection,
    baseStem,
    fulltexts
  );
  const filteredDocuments = includeChildren
    ? getDocumentsWithChildren(documentsByBaseStem, documentsByCollectionMap[baseStem.collectionId] || [])
    : documentsByBaseStem;

  let lastStageDocuments = filteredDocuments;

  for (const currentStageStem of stemsPipeline) {
    const lastStageDocumentIds = new Set(lastStageDocuments.map(doc => doc.id));
    const stageLinkInstances = linkInstances.filter(
      li => lastStageDocumentIds.add(li.documentIds[0]) || lastStageDocumentIds.add(li.documentIds[1])
    );
    const otherDocumentIds = stageLinkInstances
      .reduce((ids, li) => [...ids, ...li.documentIds], [])
      .filter(id => !lastStageDocumentIds.has(id));

    if (currentStageStem.documentIds && currentStageStem.documentIds.length > 0) {
      currentStageStem.documentIds = arrayIntersection(currentStageStem.documentIds, otherDocumentIds);
    } else {
      currentStageStem.documentIds = otherDocumentIds;
    }

    if (currentStageStem.documentIds.length === 0) {
      break;
    }

    const currentStageCollection = collections.find(collection => collection.id === currentStageStem.collectionId);
    const currentStageDocuments = filterDocumentsByAllConditions(
      documentsByCollectionMap[currentStageStem.collectionId] || [],
      currentStageCollection,
      currentStageStem,
      fulltexts
    );
    if (currentStageDocuments.length === 0) {
      break;
    }

    filteredDocuments.push(...currentStageDocuments);
    lastStageDocuments = currentStageDocuments;
  }

  return filteredDocuments;
}

function cleanStemForBaseCollection(stem: QueryStemModel, documents: DocumentModel[]): QueryStemModel {
  return cleanStemForCollection(stem, documents, stem.collectionId);
}

function cleanStemForCollection(
  stem: QueryStemModel,
  documents: DocumentModel[],
  collectionId: string
): QueryStemModel {
  const filters = getFiltersByCollection(stem.filters, collectionId);
  const documentIds = getDocumentIdsByCollection(stem.documentIds, documents);
  return {collectionId, filters, documentIds};
}

function getFiltersByCollection(filters: AttributeFilterModel[], collectionId: string): AttributeFilterModel[] {
  return (filters && filters.filter(filter => filter.collectionId === collectionId)) || [];
}

function getDocumentIdsByCollection(documentsIds: string[], documentsByCollection: DocumentModel[]) {
  return (documentsIds && documentsIds.filter(id => documentsByCollection.find(document => document.id === id))) || [];
}

function createStemsPipeline(
  stem: QueryStemModel,
  collections: CollectionModel[],
  linkTypes: LinkTypeModel[],
  documentsByCollectionMap: {[collectionId: string]: [DocumentModel]}
): QueryStemModel[] {
  const pipeline: QueryStemModel[] = [];
  let lastCollectionId = stem.collectionId;

  const stemLinkTypeIds = stem.linkTypeIds || [];
  let stemLinkTypes = linkTypes.filter(linkType => stemLinkTypeIds.includes(linkType.id));

  for (let i = 0; i < stemLinkTypeIds.length; i++) {
    const linkType = stemLinkTypes.find(linkType => linkType.collectionIds.includes(lastCollectionId));
    if (!linkType) {
      return pipeline;
    }

    const currentCollectionId = getOtherLinkedCollectionId(linkType, lastCollectionId);
    if (!collections.find(collection => collection.id === currentCollectionId)) {
      return pipeline;
    }

    pipeline.push(
      cleanStemForCollection(stem, documentsByCollectionMap[currentCollectionId] || [], currentCollectionId)
    );
    lastCollectionId = currentCollectionId;
    stemLinkTypes = stemLinkTypes.filter(lt => lt.id !== linkType.id);
  }

  return pipeline;
}

function filterDocumentsByAllConditions(
  documents: DocumentModel[],
  collection: CollectionModel,
  stem: QueryStemModel,
  fulltexts: string[]
): DocumentModel[] {
  let documentsToFilter = documents;
  if (stem.documentIds && stem.documentIds.length > 0) {
    documentsToFilter = documents.filter(document => stem.documentIds.includes(document.id));
  }
  return filterDocumentsByFiltersAndFulltexts(documentsToFilter, collection, stem.filters, fulltexts);
}

function filterDocumentsByFiltersAndFulltexts(
  documents: DocumentModel[],
  collection: CollectionModel,
  filters: AttributeFilterModel[],
  fulltexts: string[]
): DocumentModel[] {
  const fulltextsLowerCase = (fulltexts && fulltexts.map(fulltext => fulltext.toLowerCase())) || [];
  const matchedAttributesIds =
    (fulltextsLowerCase.length > 0 &&
      collection.attributes
        .filter(attribute => fulltextsLowerCase.every(fulltext => attribute.name.toLowerCase().includes(fulltext)))
        .map(attribute => attribute.id)) ||
    [];

  return documents.filter(
    document =>
      documentMeetsFilters(document, filters) &&
      documentMeetsFulltexts(document, fulltextsLowerCase, matchedAttributesIds)
  );
}

export function filterDocumentsByFulltexts(
  documents: DocumentModel[],
  collection: CollectionModel,
  fulltexts: string[]
): DocumentModel[] {
  return filterDocumentsByFiltersAndFulltexts(documents, collection, [], fulltexts);
}

function documentMeetsFulltexts(document: DocumentModel, fulltextsLowerCase: string[], matchedAttributesIds: string[]) {
  if (!fulltextsLowerCase || fulltextsLowerCase.length === 0) {
    return true;
  }

  const documentAttributesIds = Object.keys(document.data);
  if (arrayIntersection(documentAttributesIds, matchedAttributesIds).length > 0) {
    return true;
  }

  return fulltextsLowerCase.every(fulltext =>
    Object.values(document.data).some(value =>
      (value || '')
        .toString()
        .toLowerCase()
        .includes(fulltext)
    )
  );
}

function documentMeetsFilters(document: DocumentModel, filters: AttributeFilterModel[]): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  return filters.every(filter => documentMeetFilter(document, filter));
}

function documentMeetFilter(document: DocumentModel, filter: AttributeFilterModel): boolean {
  if (document.collectionId !== filter.collectionId) {
    return true;
  }
  const dataValue = document.data[filter.attributeId];
  const filterValue = filter.value;
  switch (conditionFromString(filter.condition || '')) {
    case ConditionType.Equals:
      return dataValue === filterValue;
    case ConditionType.NotEquals:
      return dataValue !== filterValue;
    case ConditionType.GreaterThan:
      return dataValue > filterValue;
    case ConditionType.GreaterThanEquals:
      return dataValue >= filterValue;
    case ConditionType.LowerThan:
      return dataValue < filterValue;
    case ConditionType.LowerThanEquals:
      return dataValue <= filterValue;
  }
  return true;
}

function paginate(documents: DocumentModel[], query: QueryModel) {
  if (!query || isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}
