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

import {AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';

import {QueryItem} from '../../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../../../shared/top-panel/search-box/query-item/model/query-item-type';
import {CollectionAttributeFilter, LinkAttributeFilter, Query, QueryCondition, QueryStem} from './query';
import {LinkType} from '../../link-types/link.type';
import {createRange, isArraySubset, uniqueValues} from '../../../../shared/utils/array.utils';
import {deepObjectsEquals, isNullOrUndefined} from '../../../../shared/utils/common.utils';
import {getOtherLinkedCollectionId} from '../../../../shared/utils/link-type.utils';
import {Collection} from '../../collections/collection';
import {AttributesResource} from '../../../model/resource';
import {ConstraintType} from '../../../model/data/constraint';
import {AttributeQueryItem} from '../../../../shared/top-panel/search-box/query-item/model/attribute.query-item';
import {LinkAttributeQueryItem} from '../../../../shared/top-panel/search-box/query-item/model/link-attribute.query-item';

export function queryItemToForm(queryItem: QueryItem): AbstractControl {
  switch (queryItem.type) {
    case QueryItemType.View:
    case QueryItemType.Document:
    case QueryItemType.Collection:
    case QueryItemType.Link:
      return new FormGroup({
        value: new FormControl(queryItem.value, Validators.required),
        text: new FormControl(queryItem.text, Validators.required),
      });
    case QueryItemType.Deleted:
    case QueryItemType.Fulltext:
      return new FormGroup({
        value: new FormControl(queryItem.value, Validators.required),
      });
    case QueryItemType.Attribute:
    case QueryItemType.LinkAttribute:
      return new FormGroup(
        {
          text: new FormControl(queryItem.text, Validators.required),
          condition: new FormControl(queryItem.condition),
          conditionValues: new FormArray(attributeConditionValuesForms(queryItem)),
          constraintType: new FormControl(queryItemConstraintType(queryItem)),
        },
        attributeQueryValidator
      );
  }
}

function queryItemConstraintType(queryItem: QueryItem): ConstraintType {
  const attribute = (<AttributeQueryItem>queryItem).attribute || (<LinkAttributeQueryItem>queryItem).attribute;
  return (attribute && attribute.constraint && attribute.constraint.type) || ConstraintType.Unknown;
}

function attributeConditionValuesForms(queryItem: QueryItem): FormGroup[] {
  return createRange(0, 2).map(index => {
    const conditionValue = queryItem.conditionValues && queryItem.conditionValues[index];
    return new FormGroup({
      type: new FormControl(conditionValue && conditionValue.type),
      value: new FormControl(conditionValue && conditionValue.value),
    });
  });
}

function attributeQueryValidator(group: FormGroup): ValidationErrors | null {
  const condition = group.controls.condition.value;
  const conditionValue = group.controls.conditionValues.value;
  const constraintType = group.controls.constraintType.value;

  if (!condition) {
    return {emptyCondition: true};
  }

  const everyValueDefined = createRange(0, queryConditionNumInputs(condition)).every(
    index =>
      conditionValue[index] &&
      (conditionValue[index].type || conditionValue[index].value || constraintType === ConstraintType.Boolean)
  );

  if (!everyValueDefined) {
    return {emptyValue: true};
  }

  return null;
}

export function queryConditionNumInputs(condition: QueryCondition): number {
  switch (condition) {
    case QueryCondition.IsEmpty:
    case QueryCondition.NotEmpty:
      return 0;
    case QueryCondition.Between:
    case QueryCondition.NotBetween:
      return 2;
    default:
      return 1;
  }
}

export function queryIsNotEmpty(query: Query): boolean {
  return (
    (query.stems && query.stems.length > 0) ||
    (query.fulltexts && query.fulltexts.length > 0) ||
    !isNullOrUndefined(query.page) ||
    !!query.pageSize
  );
}

export function queryIsEmpty(query: Query): boolean {
  return !queryIsNotEmpty(query);
}

export function queryIsNotEmptyExceptPagination(query: Query): boolean {
  return (query.stems && query.stems.length > 0) || (query.fulltexts && query.fulltexts.length > 0);
}

export function queryIsEmptyExceptPagination(query: Query): boolean {
  return !queryIsNotEmptyExceptPagination(query);
}

export function isSingleCollectionQuery(query: Query): boolean {
  return query && query.stems && query.stems.length === 1;
}

export function isAnyCollectionQuery(query: Query): boolean {
  return query && query.stems && query.stems.length > 0;
}

export function getQueryFiltersForCollection(query: Query, collectionId: string): CollectionAttributeFilter[] {
  const stems = (query && query.stems) || [];
  return stems.reduce((filters, stem) => {
    const newFilters = (stem.filters || []).filter(
      filter => filter.collectionId === collectionId && !filters.find(f => deepObjectsEquals(f, filter))
    );
    filters.push(...newFilters);
    return filters;
  }, []);
}

export function getQueryFiltersForLinkType(query: Query, linkTypeId: string): CollectionAttributeFilter[] {
  const stems = (query && query.stems) || [];
  return stems.reduce((filters, stem) => {
    const newFilters = (stem.linkFilters || []).filter(
      filter => filter.linkTypeId === linkTypeId && !filters.find(f => deepObjectsEquals(f, filter))
    );
    filters.push(...newFilters);
    return filters;
  }, []);
}

export function getAllLinkTypeIdsFromQuery(query: Query): string[] {
  return (
    (query &&
      query.stems &&
      query.stems.reduce((ids, stem) => {
        (stem.linkTypeIds || []).forEach(linkTypeId => !ids.includes(linkTypeId) && ids.push(linkTypeId));
        return ids;
      }, [])) ||
    []
  );
}

export function getAllCollectionIdsFromQuery(query: Query, linkTypes: LinkType[]): string[] {
  const basicCollectionIds = getBaseCollectionIdsFromQuery(query);
  const allLinkTypeIds = getAllLinkTypeIdsFromQuery(query);
  const filteredLinkTypes = (linkTypes || []).filter(linkType => allLinkTypeIds.includes(linkType.id));
  const collectionIdsFromLinks = filteredLinkTypes.reduce((ids, linkType) => {
    ids.push(...linkType.collectionIds);
    return ids;
  }, []);
  return uniqueValues<string>([...basicCollectionIds, ...collectionIdsFromLinks]);
}

export function getBaseCollectionIdsFromQuery(query: Query): string[] {
  return (query && query.stems && query.stems.map(stem => stem.collectionId)) || [];
}

export function isQuerySubset(superset: Query, subset: Query): boolean {
  if (!isArraySubset(superset.fulltexts || [], subset.fulltexts || [])) {
    return false;
  }

  if (subset.stems.length > superset.stems.length) {
    return false;
  }

  return subset.stems.every(stem => {
    const supersetStem = superset.stems.find(s => s.collectionId === stem.collectionId);
    return supersetStem && isQueryStemSubset(supersetStem, stem);
  });
}

export function isQueryStemSubset(superset: QueryStem, subset: QueryStem): boolean {
  return (
    superset.collectionId === subset.collectionId &&
    isArraySubset(superset.linkTypeIds || [], subset.linkTypeIds || []) &&
    isArraySubset(superset.documentIds || [], subset.documentIds || []) &&
    isQueryFiltersSubset(superset.filters || [], subset.filters || []) &&
    isQueryLinkFiltersSubset(superset.linkFilters || [], subset.linkFilters || [])
  );
}

function isQueryFiltersSubset(superset: CollectionAttributeFilter[], subset: CollectionAttributeFilter[]): boolean {
  return subset.every(sub => !!superset.find(sup => JSON.stringify(sup) === JSON.stringify(sub)));
}

function isQueryLinkFiltersSubset(superset: LinkAttributeFilter[], subset: LinkAttributeFilter[]): boolean {
  return subset.every(sub => !!superset.find(sup => JSON.stringify(sup) === JSON.stringify(sub)));
}

export function queryWithoutLinks(query: Query): Query {
  if (!query) {
    return query;
  }

  const stems = query.stems && query.stems.map(stem => ({...stem, linkTypeIds: []}));
  return {...query, stems};
}

export function queryWithoutFilters(query: Query): Query {
  if (!query) {
    return query;
  }

  const stems: QueryStem[] = query.stems && query.stems.map(stem => ({...stem, filters: [], linkFilters: []}));
  return {...query, stems, fulltexts: []};
}

export function filterStemByLinkIndex(stem: QueryStem, linkIndex: number, linkTypes: LinkType[]): QueryStem {
  const stemCopy = {...stem, linkTypeIds: stem.linkTypeIds.slice(0, linkIndex)};
  const notRemovedCollectionIds = collectionIdsChainForStem(stemCopy, linkTypes);

  stemCopy.filters =
    stem.filters && stem.filters.filter(filter => notRemovedCollectionIds.includes(filter.collectionId));
  stemCopy.linkFilters =
    stem.linkFilters && stem.linkFilters.filter(filter => stem.linkTypeIds.includes(filter.linkTypeId));

  // TODO filter documents once implemented

  return stemCopy;
}

export function findStemIndexForCollection(query: Query, collectionId: string, linkTypes: LinkType[]): number {
  for (let i = (query.stems || []).length - 1; i >= 0; i--) {
    const collectionIds = collectionIdsChainForStem(query.stems[i], linkTypes);
    if (collectionIds.includes(collectionId)) {
      return i;
    }
  }

  return -1;
}

export function findStemIndexForLinkType(query: Query, linkTypeId: string): number {
  for (let i = (query.stems || []).length - 1; i >= 0; i--) {
    if ((query.stems[i].linkTypeIds || []).includes(linkTypeId)) {
      return i;
    }
  }

  return -1;
}

export function findStemIndexForLinkTypeToJoin(query: Query, linkType: LinkType, linkTypes: LinkType[]): number {
  for (let i = (query.stems || []).length - 1; i >= 0; i--) {
    const collectionIdsChain = collectionIdsChainForStem(query.stems[i], linkTypes);
    const lastCollectionId = collectionIdsChain[collectionIdsChain.length - 1];
    if (linkType.collectionIds.includes(lastCollectionId)) {
      return i;
    }
  }

  return -1;
}

export function collectionIdsChainForStem(stem: QueryStem, linkTypes: LinkType[]): string[] {
  if (!stem) {
    return [];
  }
  const chain = [stem.collectionId];
  for (const linkTypeId of stem.linkTypeIds || []) {
    const linkType = (linkTypes || []).find(lt => lt.id === linkTypeId);
    if (!linkType) {
      break;
    }

    const otherCollectionId = getOtherLinkedCollectionId(linkType, chain[chain.length - 1]);
    chain.push(otherCollectionId);
  }

  return chain;
}

export function queryStemAttributesResourcesOrder(
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): AttributesResource[] {
  const baseCollection = stem && (collections || []).find(collection => collection.id === stem.collectionId);
  if (!baseCollection) {
    return [];
  }
  const chain: AttributesResource[] = [{...baseCollection}];
  let previousCollection = baseCollection;
  for (let i = 0; i < (stem.linkTypeIds || []).length; i++) {
    const linkType = (linkTypes || []).find(lt => lt.id === stem.linkTypeIds[i]);
    const otherCollectionId = linkType && getOtherLinkedCollectionId(linkType, previousCollection.id);
    const otherCollection =
      otherCollectionId && (collections || []).find(collection => collection.id === otherCollectionId);

    if (otherCollection && linkType) {
      chain.push({...linkType, collections: [previousCollection, otherCollection]});
      chain.push({...otherCollection});
      previousCollection = otherCollection;
    } else {
      break;
    }
  }

  return chain;
}

export function findBestStemConfigIndex(
  stemsConfigs: {stem?: QueryStem}[],
  collectionIds: string[],
  linkTypes: LinkType[]
): number {
  for (let i = 0; i < stemsConfigs.length; i++) {
    const stemConfigCollectionIds = collectionIdsChainForStem(stemsConfigs[i].stem, linkTypes);
    if (isArraySubset(stemConfigCollectionIds, collectionIds)) {
      return i;
    }
  }
  for (let i = 0; i < stemsConfigs.length; i++) {
    const stemConfigCollectionIds = collectionIdsChainForStem(stemsConfigs[i].stem, linkTypes);
    if (collectionIds[0] === stemConfigCollectionIds[0]) {
      return i;
    }
  }

  return 0;
}

export function filterStemsForCollection(collectionId: string, query: Query): Query {
  if (query && (query.stems || []).length > 0) {
    return {
      ...query,
      stems: query.stems.filter(stem => stem.collectionId === collectionId),
      fulltexts: query.fulltexts,
    };
  } else {
    return {stems: [{collectionId}], fulltexts: query && query.fulltexts};
  }
}
