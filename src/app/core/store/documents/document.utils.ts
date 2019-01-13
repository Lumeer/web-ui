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
import {Dictionary} from 'lodash';
import {Collection} from '../collections/collection';
import {User} from '../users/user';
import {DocumentModel} from './document.model';
import {AttributeFilter, Query, ConditionType} from '../navigation/query';
import {conditionFromString, getQueryFiltersForCollection} from '../navigation/query.util';

export function sortDocumentsByCreationDate(documents: DocumentModel[], sortDesc?: boolean): DocumentModel[] {
  const sortedDocuments = [...documents];
  return sortedDocuments.sort((a, b) => {
    const value = a.creationDate.getTime() - b.creationDate.getTime();
    return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
  });
}

export function mergeDocuments(documentsA: DocumentModel[], documentsB: DocumentModel[]): DocumentModel[] {
  const documentsAIds = documentsA.map(collection => collection.id);
  const documentsBToAdd = documentsB.filter(collection => !documentsAIds.includes(collection.id));
  return documentsA.concat(documentsBToAdd);
}

export function groupDocumentsByCollection(documents: DocumentModel[]): {[collectionId: string]: [DocumentModel]} {
  return documents.reduce((map, document) => {
    if (!map[document.collectionId]) {
      map[document.collectionId] = [];
    }
    map[document.collectionId].push(document);
    return map;
  }, {});
}

export function generateDocumentData(
  collection: Collection,
  collectionFilters: AttributeFilter[],
  currentUser?: User
): {[attributeId: string]: any} {
  if (!collection) {
    return {};
  }
  const data = collection.attributes.reduce((acc, attr) => {
    acc[attr.id] = '';
    return acc;
  }, {});

  collectionFilters.forEach(filter => {
    const isNumber = !isNaN(Number(filter.value));
    const value = isNumber ? +filter.value : filter.value.toString();

    switch (conditionFromString(filter.condition || '')) {
      case ConditionType.GreaterThan:
        data[filter.attributeId] = isNumber ? value + 1 : value + 'a';
        break;
      case ConditionType.LowerThan:
        data[filter.attributeId] = isNumber ? value - 1 : (value as string).slice(0, -1);
        break;
      case ConditionType.NotEquals:
        data[filter.attributeId] = isNumber ? value + 1 : '';
        break;
      case ConditionType.GreaterThanEquals:
      case ConditionType.LowerThanEquals:
      case ConditionType.Equals:
      default:
        if (currentUser && filter.value === 'userEmail()') {
          data[filter.attributeId] = currentUser.email;
        } else {
          data[filter.attributeId] = filter.value;
        }
    }
  });
  return data;
}

export function generateDocumentDataByQuery(query: Query, currentUser: User): {[attributeId: string]: any} {
  const collectionId = query && query.stems && query.stems.length > 0 && query.stems[0].collectionId;
  const collection: Collection = {
    id: collectionId,
    name: '',
    attributes: [],
  };

  return generateDocumentData(collection, getQueryFiltersForCollection(query, collectionId), currentUser);
}

export function calculateDocumentHierarchyLevel(
  documentId: string,
  documentIdsFilter: Set<string>,
  documentsMap: Dictionary<DocumentModel>
): number {
  if (!documentId || !documentIdsFilter.has(documentId)) {
    return 0;
  }

  const document = documentsMap[documentId];
  const parentDocumentId = document && document.metaData && document.metaData.parentId;
  return 1 + calculateDocumentHierarchyLevel(parentDocumentId, documentIdsFilter, documentsMap);
}
