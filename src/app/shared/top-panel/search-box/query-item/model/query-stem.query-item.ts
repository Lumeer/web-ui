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
import {CollectionQueryItem} from './collection.query-item';
import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';

export class QueryStemQueryItem implements QueryItem {
  public type = QueryItemType.QueryStem;

  private readonly linkItems: QueryItem[];
  private readonly attributeItems: QueryItem[];

  public constructor(public stemItems: QueryItem[]) {
    this.linkItems = this.stemItems.filter(item => item.type === QueryItemType.Link);
    this.attributeItems = this.stemItems.filter(
      item => item.type === QueryItemType.Attribute || item.type === QueryItemType.LinkAttribute
    );
  }

  public get id(): string {
    return this.mainStemItem().stemId;
  }

  public get text(): string {
    return this.mainStemItem().text;
  }

  public get value(): string {
    return this.mainStemItem().value;
  }

  public get icons(): string[] {
    return this.mainStemItem().icons;
  }

  public get colors(): string[] {
    return this.mainStemItem().colors;
  }

  public get linksCount(): number {
    return this.linkItems.length;
  }

  public get stemId(): string {
    return this.mainStemItem().stemId;
  }

  public get filtersCount(): number {
    return this.attributeItems.length;
  }

  private mainStemItem(): CollectionQueryItem {
    return this.stemItems[0] as CollectionQueryItem;
  }
}
