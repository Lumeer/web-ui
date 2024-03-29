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
import {Query} from '../navigation/query/query';
import {isQuerySubset, queryIsEmpty} from '../navigation/query/query.util';
import {View} from './view';

export function filterViewsByQuery(views: View[], query: Query): View[] {
  const filteredViews = (views || []).slice();

  if (!query || queryIsEmpty(query)) {
    return filteredViews;
  }

  const viewsByFulltexts =
    query.fulltexts && query.fulltexts.length > 0 ? getViewsByFulltexts(filteredViews, query.fulltexts) : [];

  const viewsBySubset = filteredViews
    .filter(view => isQuerySubset(view.query, query))
    .filter(view => !viewsByFulltexts.find(v => v.id === view.id));

  return [...viewsByFulltexts, ...viewsBySubset];
}

function getViewsByFulltexts(views: View[], fulltexts: string[]): View[] {
  return views.filter(view => fulltexts.every(fulltext => view.name.toLowerCase().includes(fulltext.toLowerCase())));
}
