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
import {Collection} from '../collections/collection';
import {Query} from '../navigation/query/query';
import {
  getQueryFiltersForCollection,
  getQueryFiltersForLinkType,
  conditionNumInputs,
} from '../navigation/query/query.util';
import {DocumentModel} from './document.model';
import {ConstraintData} from '../../model/data/constraint';
import {findAttribute} from '../collections/collection.util';
import {UnknownConstraint} from '../../model/constraint/unknown.constraint';
import {createRange} from '../../../shared/utils/array.utils';
import {isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {
  AttributesResource,
  AttributesResourceType,
  DataResourceData,
  DataResourceDataValues,
} from '../../model/resource';
import {getAttributesResourceType} from '../../../shared/utils/resource.utils';
import {AttributeFilter} from '../../model/attribute-filter';
import {Constraint} from '../../model/constraint';
import {UnknownDataValue} from '../../model/data-value/unknown.data-value';
import {convertDataValuesToData} from '../../../shared/utils/data-resource.utils';

export function sortDocumentsByCreationDate(documents: DocumentModel[], sortDesc?: boolean): DocumentModel[] {
  return [...documents].sort((a, b) => {
    const value = a.creationDate.getTime() - b.creationDate.getTime();
    return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
  });
}

export function sortDocumentsByFavoriteAndLastUsed(documents: DocumentModel[]): DocumentModel[] {
  return [...documents].sort((a, b) => {
    const aLastUsed = a.updateDate || a.creationDate;
    const bLastUsed = b.updateDate || b.creationDate;
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      if (aLastUsed && bLastUsed) {
        return bLastUsed.getTime() - aLastUsed.getTime();
      } else if (aLastUsed && !bLastUsed) {
        return -1;
      } else if (bLastUsed && !aLastUsed) {
        return 1;
      }
      return b.id.localeCompare(a.id);
    }
    return a.favorite ? -1 : 1;
  });
}

export function mergeDocuments(documentsA: DocumentModel[], documentsB: DocumentModel[]): DocumentModel[] {
  if (documentsA.length === 0 || documentsB.length === 0) {
    return documentsA.length > 0 ? documentsA : documentsB;
  }
  const documentsAIds = new Set(documentsA.map(collection => collection.id));
  const documentsBToAdd = documentsB.filter(collection => !documentsAIds.has(collection.id));
  return documentsA.concat(documentsBToAdd);
}

export function uniqueDocuments(documents: DocumentModel[]): DocumentModel[] {
  return (documents || []).reduce(
    (data, document) => {
      if (!data.ids.has(document.id)) {
        data.ids.add(document.id);
        data.documents.push(document);
      }
      return data;
    },
    {documents: [], ids: new Set()}
  ).documents;
}

export function generateDocumentDataValues(
  attributesResource: AttributesResource,
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceDataValues {
  if (!attributesResource) {
    return {};
  }
  const dataValues = setupAllAttributes
    ? attributesResource.attributes.reduce((acc, attr) => {
        acc[attr.id] = new UnknownDataValue('');
        return acc;
      }, {})
    : {};

  (filters || []).forEach(filter => {
    const attribute = findAttribute(attributesResource.attributes, filter.attributeId);
    const constraint: Constraint = attribute?.constraint || new UnknownConstraint();
    const dataValue = constraint.createDataValue(null, constraintData);
    const numInputs = conditionNumInputs(filter.condition);
    const allValuesDefined =
      constraint.isDirectlyEditable ||
      createRange(0, numInputs).every(
        i =>
          filter.conditionValues[i] &&
          (filter.conditionValues[i].type || isNotNullOrUndefined(filter.conditionValues[i].value))
      );
    if (allValuesDefined) {
      const value = dataValue.valueByCondition(filter.condition, filter.conditionValues);
      dataValues[filter.attributeId] = constraint.createDataValue(value, constraintData);
    }
  });
  return dataValues;
}

export function generateDocumentData(
  attributesResource: AttributesResource,
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceData {
  return convertDataValuesToData(
    generateDocumentDataValues(attributesResource, filters, constraintData, setupAllAttributes)
  );
}

export function generateDocumentDataValuesByQuery(
  query: Query,
  collections: Collection[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceDataValues {
  const collectionId = query?.stems?.[0].collectionId;
  const collection = collectionId && (collections || []).find(coll => coll.id === collectionId);
  if (collection) {
    return generateDocumentDataValuesByResourceQuery(collection, query, constraintData, setupAllAttributes);
  }
  return {};
}

export function generateDocumentDataByQuery(
  query: Query,
  collections: Collection[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceData {
  return convertDataValuesToData(
    generateDocumentDataValuesByQuery(query, collections, constraintData, setupAllAttributes)
  );
}

export function generateDocumentDataValuesByResourceQuery(
  attributesResource: AttributesResource,
  query: Query,
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceDataValues {
  const resourceType = getAttributesResourceType(attributesResource);
  const queryFilters =
    resourceType === AttributesResourceType.Collection
      ? getQueryFiltersForCollection(query, attributesResource.id)
      : getQueryFiltersForLinkType(query, attributesResource.id);

  return generateDocumentDataValues(attributesResource, queryFilters, constraintData, setupAllAttributes);
}

export function generateDocumentDataByResourceQuery(
  attributesResource: AttributesResource,
  query: Query,
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceData {
  return convertDataValuesToData(
    generateDocumentDataValuesByResourceQuery(attributesResource, query, constraintData, setupAllAttributes)
  );
}

export function calculateDocumentHierarchyLevel(
  documentId: string,
  documentIdsFilter: Set<string>,
  documentsMap: Record<string, DocumentModel>
): number {
  if (!documentId || !documentIdsFilter.has(documentId)) {
    return 0;
  }

  const document = documentsMap[documentId];
  const parentDocumentId = document && document.metaData && document.metaData.parentId;
  return 1 + calculateDocumentHierarchyLevel(parentDocumentId, documentIdsFilter, documentsMap);
}
