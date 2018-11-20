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
import {CollectionModel} from '../collections/collection.model';
import {QueryConverter} from '../navigation/query.converter';
import {ConditionType} from '../navigation/query.model';
import {DocumentModel} from './document.model';

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

export function groupDocumentsByCollection(documents: DocumentModel[]): {[documentId: string]: [DocumentModel]} {
  return documents.reduce((map, document) => {
    if (!map[document.collectionId]) {
      map[document.collectionId] = [];
    }
    map[document.collectionId].push(document);
    return map;
  }, {});
}

export function generateDocumentData(collection: CollectionModel, filters: string[]): {[attributeId: string]: any} {
  if (!collection) {
    return [];
  }
  const data = collection.attributes.reduce((acc, attr) => {
    acc[attr.id] = '';
    return acc;
  }, {});

  if (filters) {
    filters.map(filter => {
      const attrFilter = QueryConverter.parseFilter(filter);

      if (attrFilter.collectionId === collection.id) {
        const isNumber = !isNaN(Number(attrFilter.value));
        const value = isNumber ? +attrFilter.value : attrFilter.value.toString();

        switch (attrFilter.conditionType) {
          case ConditionType.GreaterThan:
            data[attrFilter.attributeId] = isNumber ? value + 1 : value + 'a';
            break;
          case ConditionType.LowerThan:
            data[attrFilter.attributeId] = isNumber ? value - 1 : (value as string).slice(0, -1);
            break;
          case ConditionType.NotEquals:
            data[attrFilter.attributeId] = isNumber ? value + 1 : '';
            break;
          case ConditionType.GreaterThanEquals:
          case ConditionType.LowerThanEquals:
          case ConditionType.Equals:
          default:
            data[attrFilter.attributeId] = attrFilter.value;
        }
      }
    });
  }

  return data;
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
