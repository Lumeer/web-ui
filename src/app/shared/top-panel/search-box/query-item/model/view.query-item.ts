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

import {View} from '../../../../../core/store/views/view';
import {perspectiveIconsMap} from '../../../../../view/perspectives/perspective';
import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {COLOR_PRIMARY, COLOR_QUERY_FULLTEXT} from '../../../../../core/constants';
import {Collection} from '../../../../../core/store/collections/collection';
import {getBaseCollectionIdsFromQuery} from '../../../../../core/store/navigation/query/query.util';
import {getViewIcon} from '../../../../../core/store/views/view.utils';

export class ViewQueryItem implements QueryItem {
  public type = QueryItemType.View;

  public icons: string[];
  public colors: string[];

  public constructor(public view: View, public primaryCollection?: Collection) {
    this.icons = [getViewIcon(view)];
    this.colors = this.parseColors();
  }

  private parseColors(): string[] {
    const queryCollectionIds = getBaseCollectionIdsFromQuery(this.view.query);
    if (
      queryCollectionIds.length > 0 &&
      this.primaryCollection &&
      queryCollectionIds[0] === this.primaryCollection.id
    ) {
      return [this.primaryCollection.color];
    } else if (((this.view.query && this.view.query.fulltexts) || []).length > 0) {
      return [COLOR_QUERY_FULLTEXT];
    }
    return [COLOR_PRIMARY];
  }

  public get text(): string {
    return this.view.name;
  }

  public get value(): string {
    return this.view.code;
  }

  public get stemId(): string {
    return null;
  }

  public dependsOn(queryItem: QueryItem): boolean {
    return false;
  }
}
