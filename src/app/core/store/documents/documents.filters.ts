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

import {User} from '../users/user';
import {DocumentModel} from './document.model';
import {groupDocumentsByCollection, mergeDocuments} from './document.utils';
import {CollectionAttributeFilter, LinkAttributeFilter, Query, QueryStem} from '../navigation/query/query';
import {isOnlyFulltextsQuery, queryIsEmptyExceptPagination} from '../navigation/query/query.util';
import {Attribute, Collection} from '../collections/collection';
import {LinkType} from '../link-types/link.type';
import {LinkInstance} from '../link-instances/link.instance';
import {getOtherLinkedCollectionId} from '../../../shared/utils/link-type.utils';
import {arrayIntersection} from '../../../shared/utils/array.utils';
import {isNullOrUndefined} from '../../../shared/utils/common.utils';
import {findAttributeConstraint} from '../collections/collection.util';
import {dataValuesMeetCondition} from '../../../shared/utils/data/data-compare.utils';
import {mergeLinkInstances} from '../link-instances/link-instance.utils';
import {UserConstraintConditionValue} from '../../model/data/constraint-condition';

export function filterDocumentsAndLinksByQuery(
  documents: DocumentModel[],
  collections: Collection[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[],
  query: Query,
  currentUser: User,
  includeChildren?: boolean
): {documents: DocumentModel[]; linkInstances: LinkInstance[]} {
  const filteredDocuments = documents.filter(document => document && typeof document === 'object');

  if (!query || queryIsEmptyExceptPagination(query)) {
    return {documents: paginate(filteredDocuments, query), linkInstances};
  }

  let documentsByStems: DocumentModel[] = [];
  let linkInstancesByStems: LinkInstance[] = [];

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
    linkTypes.forEach(linkType => {
      const linkInstancesByLinkType = filterLinksByFulltexts(linkInstances, linkType, queryWithFunctions.fulltexts);
      linkInstancesByStems.push(...linkInstancesByLinkType);
    });
  } else if (queryWithFunctions.stems) {
    queryWithFunctions.stems.forEach(stem => {
      const {allDocuments, allLinkInstances} = filterDocumentsAndLinksByStem(
        documentsByCollectionsMap,
        collections,
        linkTypes,
        linkInstances,
        stem,
        queryWithFunctions.fulltexts,
        includeChildren
      );
      documentsByStems = mergeDocuments(documentsByStems, allDocuments);
      linkInstancesByStems = mergeLinkInstances(linkInstancesByStems, allLinkInstances);
    });
  }

  return {documents: paginate(documentsByStems, queryWithFunctions), linkInstances: linkInstancesByStems};
}

function applyFunctionsToFilters(query: Query, currentUser: User): Query {
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

function applyFilterFunctions(filter: CollectionAttributeFilter, currentUser: User): any {
  const type = filter.conditionValues && filter.conditionValues[0] && filter.conditionValues[0].type;
  switch (type) {
    case UserConstraintConditionValue.CurrentUser:
      return currentUser && currentUser.email;
    default:
      return filter.conditionValues && filter.conditionValues[0] && filter.conditionValues[0].value;
  }
}

function getDocumentsWithChildren(currentDocuments: DocumentModel[], allDocuments: DocumentModel[]): DocumentModel[] {
  const documentsWithChildren = currentDocuments;
  const currentDocumentsIds = new Set(currentDocuments.map(doc => doc.id));
  let documentsToSearch = allDocuments.filter(document => !currentDocumentsIds.has(document.id));
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
    documentsToSearch = documentsToSearch.filter(document => !currentDocumentsIds.has(document.id));
  }

  return documentsWithChildren;
}

export function filterDocumentsAndLinksByStem(
  documentsByCollectionMap: Record<string, DocumentModel[]>,
  collections: Collection[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[],
  stem: QueryStem,
  fulltexts: string[],
  includeChildren?: boolean
): {allDocuments: DocumentModel[]; pipelineDocuments: DocumentModel[][]; allLinkInstances: LinkInstance[]} {
  const allDocuments = [];
  const pipelineDocuments = [];
  const allLinkInstances = [];
  const baseCollection = collections.find(collection => collection.id === stem.collectionId);
  if (!baseCollection) {
    return {allDocuments, pipelineDocuments, allLinkInstances};
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

  allDocuments.push(...filteredDocuments);
  pipelineDocuments[0] = filteredDocuments;

  let lastStageDocuments = filteredDocuments;

  for (let i = 0; i < stemsPipeline.length; i++) {
    const linkTypeId = stem.linkTypeIds[i];
    const linkType = linkTypes.find(lt => lt.id === linkTypeId);
    const currentStageStem = stemsPipeline[i];

    const lastStageDocumentIds = new Set(lastStageDocuments.map(doc => doc.id));
    const stageLinkInstances = linkInstances.filter(
      li =>
        li.linkTypeId === linkTypeId &&
        (lastStageDocumentIds.has(li.documentIds[0]) || lastStageDocumentIds.has(li.documentIds[1]))
    );
    const filteredLinkInstances = filterLinksByFiltersAndFulltexts(
      stageLinkInstances,
      linkType,
      currentStageStem.linkFilters,
      fulltexts
    );

    const otherDocumentIds: string[] = filteredLinkInstances
      .reduce((ids, li) => {
        ids.push(...li.documentIds);
        return ids;
      }, [])
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

    allDocuments.push(...currentStageDocuments);
    pipelineDocuments[i + 1] = currentStageDocuments;
    allLinkInstances.push(...filteredLinkInstances);
    lastStageDocuments = currentStageDocuments;
  }

  return {allDocuments, pipelineDocuments, allLinkInstances};
}

function cleanStemForBaseCollection(stem: QueryStem, documents: DocumentModel[]): QueryStem {
  return cleanStemForCollectionAndLink(stem, documents, stem.collectionId);
}

function cleanStemForCollectionAndLink(
  stem: QueryStem,
  documents: DocumentModel[],
  collectionId: string,
  linkTypeId?: string
): QueryStem {
  const filters = getFiltersByCollection(stem.filters, collectionId);
  const documentIds = getDocumentIdsByCollection(stem.documentIds, documents);
  let linkFilters = null;
  if (linkTypeId) {
    linkFilters = getLinkFiltersByLink(stem.linkFilters, linkTypeId);
  }
  return {collectionId, filters, documentIds, linkFilters};
}

function getFiltersByCollection(
  filters: CollectionAttributeFilter[],
  collectionId: string
): CollectionAttributeFilter[] {
  return (filters && filters.filter(filter => filter.collectionId === collectionId)) || [];
}

function getDocumentIdsByCollection(documentsIds: string[], documentsByCollection: DocumentModel[]) {
  return (documentsIds && documentsIds.filter(id => documentsByCollection.find(document => document.id === id))) || [];
}

function getLinkFiltersByLink(filters: LinkAttributeFilter[], linkTypeId: string): LinkAttributeFilter[] {
  return (filters && filters.filter(filter => filter.linkTypeId === linkTypeId)) || [];
}

function createStemsPipeline(
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[],
  documentsByCollectionMap: Record<string, DocumentModel[]>
): QueryStem[] {
  const pipeline: QueryStem[] = [];
  let lastCollectionId = stem.collectionId;

  const stemLinkTypeIds = stem.linkTypeIds || [];
  let stemLinkTypes = linkTypes.filter(linkType => stemLinkTypeIds.includes(linkType.id));

  for (let i = 0; i < stemLinkTypeIds.length; i++) {
    const linkType = stemLinkTypes.find(lt => lt.collectionIds.includes(lastCollectionId));
    if (!linkType) {
      return pipeline;
    }

    const currentCollectionId = getOtherLinkedCollectionId(linkType, lastCollectionId);
    if (!collections.find(collection => collection.id === currentCollectionId)) {
      return pipeline;
    }

    pipeline.push(
      cleanStemForCollectionAndLink(
        stem,
        documentsByCollectionMap[currentCollectionId] || [],
        currentCollectionId,
        linkType.id
      )
    );
    lastCollectionId = currentCollectionId;
    stemLinkTypes = stemLinkTypes.filter(lt => lt.id !== linkType.id);
  }

  return pipeline;
}

function filterDocumentsByAllConditions(
  documents: DocumentModel[],
  collection: Collection,
  stem: QueryStem,
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
  collection: Collection,
  filters: CollectionAttributeFilter[],
  fulltexts: string[]
): DocumentModel[] {
  const fulltextsLowerCase = (fulltexts && fulltexts.map(fulltext => fulltext.toLowerCase())) || [];
  const matchedAttributesIds = matchAttributesByFulltexts(collection.attributes, fulltexts).map(attr => attr.id);

  return documents.filter(
    document =>
      documentMeetsFilters(document, collection, filters) &&
      dataMeetsFulltexts(document.data, fulltextsLowerCase, matchedAttributesIds)
  );
}

function matchAttributesByFulltexts(attributes: Attribute[], fulltexts: string[]): Attribute[] {
  if (!fulltexts || fulltexts.length === 0) {
    return [];
  }

  return (attributes || []).filter(attribute =>
    fulltexts.every(fulltext => attribute.name.toLowerCase().includes(fulltext))
  );
}

function filterLinksByFulltexts(
  linkInstances: LinkInstance[],
  linkType: LinkType,
  fulltexts: string[]
): LinkInstance[] {
  return filterLinksByFiltersAndFulltexts(linkInstances, linkType, [], fulltexts);
}

function filterLinksByFiltersAndFulltexts(
  linkInstances: LinkInstance[],
  linkType: LinkType,
  filters: LinkAttributeFilter[],
  fulltexts: string[]
): LinkInstance[] {
  const fulltextsLowerCase = (fulltexts && fulltexts.map(fulltext => fulltext.toLowerCase())) || [];
  const matchedAttributesIds = matchAttributesByFulltexts(linkType.attributes, fulltexts).map(attr => attr.id);

  return linkInstances.filter(
    linkInstance =>
      linkMeetsFilters(linkInstance, linkType, filters) &&
      dataMeetsFulltexts(linkInstance.data, fulltextsLowerCase, matchedAttributesIds)
  );
}

export function filterDocumentsByFulltexts(
  documents: DocumentModel[],
  collection: Collection,
  fulltexts: string[]
): DocumentModel[] {
  return filterDocumentsByFiltersAndFulltexts(documents, collection, [], fulltexts);
}

function dataMeetsFulltexts(data: Record<string, any>, fulltextsLowerCase: string[], matchedAttributesIds: string[]) {
  if (!fulltextsLowerCase || fulltextsLowerCase.length === 0) {
    return true;
  }

  const documentAttributesIds = Object.keys(data);
  if (arrayIntersection(documentAttributesIds, matchedAttributesIds).length > 0) {
    return true;
  }

  return fulltextsLowerCase.every(fulltext =>
    Object.values(data).some(value =>
      (value || '')
        .toString()
        .toLowerCase()
        .includes(fulltext)
    )
  );
}

function documentMeetsFilters(
  document: DocumentModel,
  collection: Collection,
  filters: CollectionAttributeFilter[]
): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  return filters.every(filter => documentMeetFilter(document, collection, filter));
}

function documentMeetFilter(
  document: DocumentModel,
  collection: Collection,
  filter: CollectionAttributeFilter
): boolean {
  if (document.collectionId !== filter.collectionId) {
    return true;
  }
  return dataMeetFilter(document.data, collection.attributes, filter);
}

function linkMeetsFilters(linkInstance: LinkInstance, linkType: LinkType, filters: LinkAttributeFilter[]): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  return filters.every(filter => linkMeetFilter(linkInstance, linkType, filter));
}

function linkMeetFilter(linkInstance: LinkInstance, linkType: LinkType, filter: LinkAttributeFilter): boolean {
  if (linkInstance.linkTypeId !== filter.linkTypeId) {
    return true;
  }
  return dataMeetFilter(linkInstance.data, linkType.attributes, filter);
}

function dataMeetFilter(
  data: Record<string, any>,
  attributes: Attribute[],
  filter: CollectionAttributeFilter | LinkAttributeFilter
) {
  const constraint = findAttributeConstraint(attributes, filter.attributeId);
  const dataValue = data[filter.attributeId];
  const filterValue = filter.conditionValues && filter.conditionValues[0] && filter.conditionValues[0].value;

  return dataValuesMeetCondition(dataValue, filterValue, filter.condition, constraint);
}

function paginate(documents: DocumentModel[], query: Query) {
  if (!query || isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize)) {
    return documents;
  }

  return documents.slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}
