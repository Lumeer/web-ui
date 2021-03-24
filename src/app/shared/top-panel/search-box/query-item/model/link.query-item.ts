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

import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {Collection} from '../../../../../core/store/collections/collection';

export class LinkQueryItem implements QueryItem {
  public type = QueryItemType.Link;

  public constructor(public linkType: LinkType) {}

  public get icons(): string[] {
    return (
      this.notNullCollections()
        .map(collection => collection.icon)
        .filter(icon => !!icon) || []
    );
  }

  public get colors(): string[] {
    return (
      this.notNullCollections()
        .map(collection => collection.color)
        .filter(color => !!color) || []
    );
  }

  public get collectionIds(): string[] {
    return (
      this.notNullCollections()
        .map(collection => collection?.id)
        .filter(id => !!id) || []
    );
  }

  private notNullCollections(): Collection[] {
    return this.linkType.collections?.filter(collection => !!collection) || [];
  }

  public get text(): string {
    return this.linkType.name;
  }

  public get value(): string {
    return this.linkType.id;
  }
}
