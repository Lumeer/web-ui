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
import {getQueryFiltersForCollection, getQueryFiltersForLinkType} from '../navigation/query/query.util';
import {DocumentModel} from './document.model';
import {findAttribute, findAttributeConstraint} from '../collections/collection.util';
import {createRange} from '../../../shared/utils/array.utils';
import {isArray, isNotNullOrUndefined, objectsByIdMap} from '../../../shared/utils/common.utils';
import {AttributesResource, AttributesResourceType, DataResourceData} from '../../model/resource';
import {getAttributesResourceType} from '../../../shared/utils/resource.utils';
import {
  AttributeFilter,
  ConditionType,
  conditionTypeNumberOfInputs,
  Constraint,
  ConstraintData,
  ConstraintType,
  DataValue,
  DateTimeConstraint,
  UnknownConstraint,
} from '@lumeer/data-filters';

export function sortDocumentsByCreationDate(documents: DocumentModel[], sortDesc?: boolean): DocumentModel[] {
  return [...documents].sort((a, b) => {
    const value = a.creationDate.getTime() - b.creationDate.getTime();
    return (value !== 0 ? value : a.id.localeCompare(b.id)) * (sortDesc ? -1 : 1);
  });
}

export function sortDocumentsByFavoriteAndLastUsed(documents: DocumentModel[]): DocumentModel[] {
  return [...documents].sort((a, b) => {
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      const datesCompare = compareDocumentsDates(a.updateDate || a.creationDate, b.updateDate || b.creationDate, true);
      if (isNotNullOrUndefined(datesCompare)) {
        return datesCompare;
      }
      return b.id.localeCompare(a.id);
    }
    return a.favorite ? -1 : 1;
  });
}

function compareDocumentsDates(date1: Date, date2: Date, sortDesc?: boolean): number {
  const multiplier = sortDesc ? -1 : 1;
  if (date1 && date2) {
    return (date1.getTime() - date2.getTime()) * multiplier;
  } else if (date1 && !date2) {
    return multiplier;
  } else if (date2 && !date1) {
    return -multiplier;
  }
  return null;
}

export function sortDocumentsTasks(documents: DocumentModel[], collections: Collection[]): DocumentModel[] {
  const collectionsMap = objectsByIdMap(collections);
  return [...documents].sort((a, b) => {
    if ((a.favorite && b.favorite) || (!a.favorite && !b.favorite)) {
      const dueDateCompare = compareDataValues(
        getDocumentDueDateDataValue(a, collectionsMap),
        getDocumentDueDateDataValue(b, collectionsMap)
      );
      if (dueDateCompare) {
        return dueDateCompare;
      }

      const priorityCompare = compareDataValues(
        getDocumentPriorityDataValue(a, collectionsMap),
        getDocumentPriorityDataValue(b, collectionsMap)
      );
      if (priorityCompare) {
        return priorityCompare;
      }

      const datesCompare = compareDocumentsDates(a.updateDate || a.creationDate, b.updateDate || b.creationDate);
      if (datesCompare) {
        return datesCompare;
      }
      return a.id.localeCompare(b.id);
    }
    return a.favorite ? -1 : 1;
  });
}

export function getDocumentDueDateDataValue(
  document: DocumentModel,
  collectionsMap: Record<string, Collection>
): DataValue {
  const collection = collectionsMap?.[document.collectionId];
  const attribute = findAttribute(collection?.attributes, collection?.purpose?.metaData?.dueDateAttributeId);
  if (attribute?.constraint?.type === ConstraintType.DateTime) {
    const constraint = <DateTimeConstraint>attribute.constraint;
    return constraint.createDataValue(document?.data?.[attribute.id]);
  }
  return null;
}

export function getDocumentPriorityDataValue(
  document: DocumentModel,
  collectionsMap: Record<string, Collection>
): DataValue {
  const collection = collectionsMap?.[document.collectionId];
  const attribute = findAttribute(collection?.attributes, collection?.purpose?.metaData?.priorityAttributeId);
  return attribute?.constraint?.createDataValue(document?.data?.[attribute.id]);
}

function compareDataValues(dv1: DataValue, dv2: DataValue): number {
  if (dv1 && dv2) {
    return dv1.compareTo(dv2);
  } else if (dv1 && !dv2) {
    return 1;
  } else if (dv2 && !dv1) {
    return -1;
  }
  return null;
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

export function groupDocumentsByCollection(documents: DocumentModel[]): Record<string, DocumentModel[]> {
  return (documents || []).reduce((map, document) => {
    if (!map[document.collectionId]) {
      map[document.collectionId] = [];
    }
    map[document.collectionId].push(document);
    return map;
  }, {});
}

export function generateDocumentData(
  attributesResource: AttributesResource,
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): Record<string, any> {
  if (!attributesResource) {
    return {};
  }
  const data = setupAllAttributes
    ? attributesResource.attributes.reduce((acc, attr) => {
        acc[attr.id] = '';
        return acc;
      }, {})
    : {};

  (filters || []).forEach(filter => {
    const attribute = findAttribute(attributesResource.attributes, filter.attributeId);
    const constraint: Constraint = attribute?.constraint || new UnknownConstraint();
    const dataValue = constraint.createDataValue(null, constraintData);
    const numInputs = conditionTypeNumberOfInputs(filter.condition);
    const allValuesDefined =
      constraint.isDirectlyEditable ||
      createRange(0, numInputs).every(
        i =>
          filter.conditionValues[i] &&
          (filter.conditionValues[i].type || isNotNullOrUndefined(filter.conditionValues[i].value))
      );
    if (allValuesDefined) {
      data[filter.attributeId] = dataValue.valueByCondition(filter.condition, filter.conditionValues);
    }
  });
  return data;
}

export function generateDocumentDataByQuery(
  query: Query,
  collections: Collection[],
  constraintData: ConstraintData,
  setupAllAttributes = true
): Record<string, any> {
  const collectionId = query && query.stems && query.stems.length > 0 && query.stems[0].collectionId;
  const collection = collectionId && (collections || []).find(coll => coll.id === collectionId);
  if (collection) {
    return generateDocumentDataByResourceQuery(collection, query, constraintData, setupAllAttributes);
  }
  return {};
}

export function generateDocumentDataByResourceQuery(
  attributesResource: AttributesResource,
  query: Query,
  constraintData: ConstraintData,
  setupAllAttributes = true
): DataResourceData {
  const resourceType = getAttributesResourceType(attributesResource);
  const queryFilters =
    resourceType === AttributesResourceType.Collection
      ? getQueryFiltersForCollection(query, attributesResource.id)
      : getQueryFiltersForLinkType(query, attributesResource.id);

  return generateDocumentData(attributesResource, queryFilters, constraintData, setupAllAttributes);
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
  const parentDocumentId = document?.metaData?.parentId;
  return 1 + calculateDocumentHierarchyLevel(parentDocumentId, documentIdsFilter, documentsMap);
}

interface CollectionTaskDataMap {
  stateConstraint: Constraint;
  doneStates: Set<any>;
  doneStatesArray: any[];
}

export function filterTaskDocuments(
  documents: DocumentModel[],
  collections: Collection[],
  constraintData: ConstraintData
): DocumentModel[] {
  const tasks = [];
  const collectionsMap = objectsByIdMap(collections);
  const collectionsTasksDataMap = getCollectionTaskDataMap(collections);
  for (const document of documents) {
    const collection = collectionsMap[document.collectionId];
    const tasksData = collection && collectionsTasksDataMap[collection.id];
    if (collection && tasksData) {
      const rawValue = document?.data[collection?.purpose?.metaData?.stateAttributeId];
      if (isNotDoneState(rawValue, tasksData, constraintData)) {
        tasks.push(document);
      }
    }
  }
  return tasks;
}

function isNotDoneState(value: any, data: CollectionTaskDataMap, constraintData: ConstraintData): boolean {
  const dataValue = data.stateConstraint.createDataValue(value, constraintData);
  if (data.stateConstraint.type === ConstraintType.Boolean) {
    return data.doneStatesArray.every(doneState =>
      dataValue.meetCondition(ConditionType.NotEquals, [{value: doneState}])
    );
  } else if (data.stateConstraint.type === ConstraintType.User || data.stateConstraint.type === ConstraintType.Select) {
    return dataValue.meetCondition(ConditionType.HasNoneOf, [{value: data.doneStatesArray}]);
  }
  return !dataValueHasValue(dataValue, data.doneStates);
}

function dataValueHasValue(dataValue: DataValue, set: Set<any>): boolean {
  const serialized = dataValue.serialize();
  if (isArray(serialized)) {
    return serialized.some(value => set.has(value));
  }
  return set.has(serialized);
}

function getCollectionTaskDataMap(collections: Collection[]): Record<string, CollectionTaskDataMap> {
  return collections.reduce((map, collection) => {
    const stateConstraint =
      findAttributeConstraint(collection.attributes, collection.purpose?.metaData?.stateAttributeId) ||
      new UnknownConstraint();
    const doneStates = collection.purpose?.metaData?.finalStatesList;
    const doneStatesArray = isNotNullOrUndefined(doneStates) ? (isArray(doneStates) ? doneStates : [doneStates]) : [];
    map[collection.id] = {
      stateConstraint,
      doneStates: new Set(doneStatesArray),
      doneStatesArray,
    };
    return map;
  }, {});
}
