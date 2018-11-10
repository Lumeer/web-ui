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

import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {CollectionQueryItem} from './collection.query-item';

export class LinkQueryItem implements QueryItem {
  public type = QueryItemType.Link;

  public icons: string[];
  public colors: string[];
  public collectionIds: string[];

  public constructor(public linkType: LinkTypeModel) {
    this.icons = linkType.collections.map(collection => collection.icon);
    this.colors = linkType.collections.map(collection => collection.color);
    this.collectionIds = linkType.collections.map(collection => collection.id);
  }

  public get text(): string {
    return this.linkType.name;
  }

  public get value(): string {
    return this.linkType.id;
  }

  public dependsOn(queryItem: QueryItem): boolean {
    if (queryItem.type === QueryItemType.Collection) {
      return (queryItem as CollectionQueryItem).collection.id === this.collectionIds[0];
    }
    return false;
  }
}
