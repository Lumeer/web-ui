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

import {CollectionAttributeFilter, LinkAttributeFilter, Query, QueryStem} from './query';
import {AttributeFilter, ConditionType, ConditionValue, ConstraintConditionValue} from '@lumeer/data-filters';

export interface ShortenedQuery {
  s: ShortenedQueryStem[]; // stems
  f: string[]; // fulltexts
  p: number; // page
  l: number; // pageSize (limit)
}

export interface ShortenedQueryStem {
  c: string; // collectionId
  l: string[]; // linkTypeIds
  d: string[]; // documentIds
  f: ShortenedCollectionAttributeFilter[]; // filters
  lf: ShortenedLinkAttributeFilter[]; // linkFilters
}

export interface ShortenedAttributeFilter {
  e: string; // condition (expression)
  a: string; // attributeId
  v: ShortenedConditionValue[]; // value
}

export interface ShortenedConditionValue {
  t: string; // type
  v: any; // value
}

export interface ShortenedCollectionAttributeFilter extends ShortenedAttributeFilter {
  c: string; // collectionId
}

export interface ShortenedLinkAttributeFilter extends ShortenedAttributeFilter {
  l: string; // linkTypeId
}

export function shortenQuery(query: Query): ShortenedQuery {
  return (
    query && {
      s: query.stems?.map(stem => shortenQueryStem(stem)),
      f: query.fulltexts,
      p: query.page,
      l: query.pageSize,
    }
  );
}

function shortenQueryStem(stem: QueryStem): ShortenedQueryStem {
  return {
    c: stem.collectionId,
    l: stem.linkTypeIds,
    d: stem.documentIds,
    f: stem.filters?.map(filter => shortenCollectionAttributeFilter(filter)),
    lf: stem.linkFilters?.map(filter => shortenLinkAttributeFilter(filter)),
  };
}

function shortenCollectionAttributeFilter(filter: CollectionAttributeFilter): ShortenedCollectionAttributeFilter {
  return {...shortenAttributeFilter(filter), c: filter.collectionId};
}

function shortenLinkAttributeFilter(filter: LinkAttributeFilter): ShortenedLinkAttributeFilter {
  return {...shortenAttributeFilter(filter), l: filter.linkTypeId};
}

function shortenAttributeFilter(filter: AttributeFilter): ShortenedAttributeFilter {
  return {
    e: filter.condition,
    a: filter.attributeId,
    v: (filter.conditionValues || []).map(v => shortenConditionValue(v)),
  };
}

function shortenConditionValue(value: ConditionValue): ShortenedConditionValue {
  return {t: value.type, v: value.value};
}

export function prolongQuery(query: ShortenedQuery): Query {
  return (
    query && {
      stems: query.s?.map(stem => prolongQueryStem(stem)),
      fulltexts: query.f,
      page: query.p,
      pageSize: query.l,
    }
  );
}

function prolongQueryStem(stem: ShortenedQueryStem): QueryStem {
  return {
    collectionId: stem.c,
    linkTypeIds: stem.l,
    documentIds: stem.d,
    filters: stem.f?.map(filter => prolongCollectionAttributeFilter(filter)),
    linkFilters: stem.lf?.map(filter => prolongLinkAttributeFilter(filter)),
  };
}

function prolongCollectionAttributeFilter(filter: ShortenedCollectionAttributeFilter): CollectionAttributeFilter {
  return {...prolongAttributeFilter(filter), collectionId: filter.c};
}

function prolongLinkAttributeFilter(filter: ShortenedLinkAttributeFilter): LinkAttributeFilter {
  return {...prolongAttributeFilter(filter), linkTypeId: filter.l};
}

function prolongAttributeFilter(filter: ShortenedAttributeFilter): AttributeFilter {
  return {
    condition: <ConditionType>filter.e,
    attributeId: filter.a,
    conditionValues: (filter.v || []).map(value => prolongConditionValue(value)),
  };
}

function prolongConditionValue(filter: ShortenedConditionValue): ConditionValue {
  return {
    type: <ConstraintConditionValue>filter.t,
    value: filter.v,
  };
}
