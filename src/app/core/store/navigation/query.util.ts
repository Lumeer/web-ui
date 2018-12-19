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

import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

import {QueryItem} from '../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../../shared/top-panel/search-box/query-item/model/query-item-type';
import {AttributeFilter, Query, QueryStem, ConditionType} from './query';
import {LinkType} from '../link-types/link.type';
import {isArraySubset} from '../../../shared/utils/array.utils';
import {isNullOrUndefined} from '../../../shared/utils/common.utils';

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

export function getQueryFiltersForCollection(query: Query, collectionId: string): AttributeFilter[] {
  return (
    (query &&
      query.stems &&
      query.stems.reduce((filters, stem) => {
        const newFilters =
          (stem.filters &&
            stem.filters.filter(
              filter =>
                filter.collectionId === collectionId && !filters.find(f => JSON.stringify(f) === JSON.stringify(filter))
            )) ||
          [];
        return [...filters, ...newFilters];
      }, [])) ||
    []
  );
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
  const basicCollectionIds = (query && query.stems && query.stems.map(stem => stem.collectionId)) || [];
  const allLinkTypeIds =
    (query && query.stems && query.stems.reduce((ids, stem) => [...ids, ...stem.linkTypeIds], [])) || [];
  const filteredLinkTypes = (linkTypes || []).filter(linkType => allLinkTypeIds.includes(linkType.id));
  const collectionIdsFromLinks = filteredLinkTypes
    .reduce((ids, linkType) => [...ids, ...linkType.collectionIds], [])
    .filter(id => !basicCollectionIds.includes(id));
  return [...basicCollectionIds, ...collectionIdsFromLinks];
}

export function getBaseCollectionIdsFromQuery(query: Query): string[] {
  return query.stems && query.stems.map(stem => stem.collectionId);
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
    isQueryFiltersSubset(superset.filters || [], subset.filters || [])
  );
}

function isQueryFiltersSubset(superset: AttributeFilter[], subset: AttributeFilter[]): boolean {
  return subset.every(sub => !!superset.find(sup => JSON.stringify(sup) === JSON.stringify(sub)));
}

export function queryWithoutLinks(query: Query): Query {
  const stems = query.stems && query.stems.map(stem => ({...stem, linkTypeIds: []}));
  return {...query, stems};
}

export function filterStemByLinkIndex(stem: QueryStem, linkIndex: number, linkTypes: LinkType[]): QueryStem {
  const stemCopy = {...stem};
  const stemLinkTypes = stem.linkTypeIds.map(id => linkTypes.find(lt => lt.id === id));
  const removingLinkTypes = stemLinkTypes.slice(linkIndex);
  stemCopy.linkTypeIds = stem.linkTypeIds.slice(0, linkIndex);

  const removingCollections = removingLinkTypes.reduce((ids, linkType) => {
    const idsToAdd = linkType.collectionIds.filter(id => !ids.includes(id));
    return [...ids, ...idsToAdd];
  }, []);
  stemCopy.filters = stem.filters && stem.filters.filter(filter => !removingCollections.includes(filter.collectionId));

  // TODO filter documents once implemented

  return stemCopy;
}

export function filterStemByAttributeIds(stem: QueryStem, collectionId: string, attributeIds: string[]): QueryStem {
  const filters =
    stem.filters &&
    stem.filters.filter(filter => filter.collectionId !== collectionId || !attributeIds.includes(filter.attributeId));
  return {...stem, filters};
}
