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

import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

import {QueryItem} from '../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../../shared/top-panel/search-box/query-item/model/query-item-type';
import {CollectionAttributeFilter, Query, QueryStem, ConditionType, LinkAttributeFilter} from './query';
import {LinkType} from '../link-types/link.type';
import {isArraySubset, uniqueValues} from '../../../shared/utils/array.utils';
import {deepObjectsEquals, isNullOrUndefined} from '../../../shared/utils/common.utils';
import {getOtherLinkedCollectionId} from '../../../shared/utils/link-type.utils';
import {Collection} from '../collections/collection';
import {AttributesResource} from '../../model/resource';

const EqVariants = ['=', '==', 'eq', 'equals'];
const NeqVariants = ['!=', '!==', '<>', 'ne', 'neq', 'nequals'];
const LtVariants = ['<', 'lt'];
const LteVariants = ['<=', 'lte'];
const GtVariants = ['>', 'gt'];
const GteVariants = ['>=', 'gte'];

const allConditionArrays = [EqVariants, NeqVariants, LtVariants, LteVariants, GtVariants, GteVariants];

export function getAllConditions(): string[] {
  const maxElements = getMaxConditionsInArrays();

  const allConditions = [];
  for (let i = 0; i < maxElements; i++) {
    for (const array of allConditionArrays) {
      if (i < array.length) {
        allConditions.push(array[i]);
      }
    }
  }

  return allConditions;
}

function getMaxConditionsInArrays(): number {
  return allConditionArrays.reduce((acc, array) => {
    if (acc < array.length) {
      acc = array.length;
    }
    return acc;
  }, 0);
}

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
      return new FormGroup({
        text: new FormControl(queryItem.text, Validators.required),
        condition: new FormControl(queryItem.condition, [Validators.required, conditionValidator]),
        conditionValue: new FormControl(queryItem.conditionValue, [Validators.required]),
      });
  }
}

export function conditionValidator(input: FormControl): {[key: string]: any} {
  const value = input.value.toString().trim();
  const isCondition = conditionFromString(value) != null;
  return !isCondition ? {invalidCondition: value} : null;
}

export function conditionFromString(condition: string): ConditionType {
  const conditionLowerCase = condition.toLowerCase();
  if (EqVariants.includes(conditionLowerCase)) {
    return ConditionType.Equals;
  } else if (NeqVariants.includes(conditionLowerCase)) {
    return ConditionType.NotEquals;
  } else if (LtVariants.includes(conditionLowerCase)) {
    return ConditionType.LowerThan;
  } else if (LteVariants.includes(conditionLowerCase)) {
    return ConditionType.LowerThanEquals;
  } else if (GtVariants.includes(conditionLowerCase)) {
    return ConditionType.GreaterThan;
  } else if (GteVariants.includes(conditionLowerCase)) {
    return ConditionType.GreaterThanEquals;
  }
  return null;
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

export function isOnlyFulltextsQuery(query: Query): boolean {
  return (!query.stems || query.stems.length === 0) && query.fulltexts && query.fulltexts.length > 0;
}

export function getQueryFiltersForCollection(query: Query, collectionId: string): CollectionAttributeFilter[] {
  const stems = (query && query.stems) || [];
  return stems.reduce((filters, stem) => {
    const newFilters = (stem.filters || []).filter(
      filter => filter.collectionId === collectionId && !filters.find(f => deepObjectsEquals(f, filter))
    );
    return [...filters, ...newFilters];
  }, []);
}

export function getQueryFiltersForLinkType(query: Query, linkTypeId: string): CollectionAttributeFilter[] {
  const stems = (query && query.stems) || [];
  return stems.reduce((filters, stem) => {
    const newFilters = (stem.linkFilters || []).filter(
      filter => filter.linkTypeId === linkTypeId && !filters.find(f => deepObjectsEquals(f, filter))
    );
    return [...filters, ...newFilters];
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
  const collectionIdsFromLinks = filteredLinkTypes.reduce((ids, linkType) => [...ids, ...linkType.collectionIds], []);
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
  const stems = query.stems && query.stems.map(stem => ({...stem, linkTypeIds: []}));
  return {...query, stems};
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
