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

import {View} from '../../../../../core/store/views/view';
import {perspectiveIconsMap} from '../../../../../view/perspectives/perspective';
import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {CollectionQueryItem} from './collection.query-item';

export class ViewQueryItem implements QueryItem {
  public type = QueryItemType.View;

  public icons: string[];
  public colors: string[];

  public constructor(public view: View) {
    this.icons = [perspectiveIconsMap[view.perspective]];
    this.colors = ['#2c3e50'];
  }

  public get text(): string {
    return this.view.name;
  }

  public get value(): string {
    return this.view.code;
  }

  public dependsOn(queryItem: QueryItem): boolean {
    return false;
  }
}
