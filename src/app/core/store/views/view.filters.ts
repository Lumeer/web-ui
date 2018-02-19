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

import {QueryModel} from "../navigation/query.model";
import {ViewModel} from "./view.model";
import {isNullOrUndefined} from "util";

export class ViewFilters {

  public static filterByQuery(views: ViewModel[], query: QueryModel): ViewModel[] {
    let filtered = views.slice();

    if (isNullOrUndefined(query)) {
      return filtered;
    }

    if (query.fulltext && query.fulltext.length > 0) {
      filtered = filtered.filter(view => view.name.toLowerCase().includes(query.fulltext.toLowerCase()));
    }

    if (query.collectionCodes && query.collectionCodes.length > 0) {
      filtered = filtered.filter(view => view.query && ViewFilters.intersection(view.query.collectionCodes, query.collectionCodes).length > 0);
    }

    if (query.collectionIds && query.collectionIds.length > 0) {
      filtered = filtered.filter(view => view.query && ViewFilters.intersection(view.query.collectionIds, query.collectionIds).length > 0);
    }

    return filtered;
  }

  private static intersection(array1: string[], array2: string[]): string[] {
    const a = array1 || [];
    const b = array2 || [];
    return a.filter(x => b.indexOf(x) !== -1);
  }
}
