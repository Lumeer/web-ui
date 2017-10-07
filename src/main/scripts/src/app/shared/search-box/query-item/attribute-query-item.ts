/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {QueryItem} from './query-item';
import {QueryItemType} from './query-item-type';
import {Collection} from '../../../core/dto/collection';

export class AttributeQueryItem implements QueryItem {

  public type = QueryItemType.Attribute;

  public collectionCode: string;
  public collectionName: string;
  public icon: string;
  public color: string;

  public attributeName: string;
  public attributeFullName: string;
  public constraints: string[];

  public condition = '';

  public constructor(collection: Collection) {
    this.collectionCode = collection.code;
    this.collectionName = collection.name;
    this.icon = collection.icon;
    this.color = collection.color;

    const attribute = collection.attributes[0];
    this.attributeName = attribute.name;
    this.attributeFullName = attribute.fullName;
    this.constraints = attribute.constraints;
  }

  public get text() {
    return this.collectionName + ':' + this.attributeFullName;
  }

  public get value() {
    return this.collectionCode + ':' + this.attributeFullName;
  }

  public isComplete(): boolean {
    return this.condition !== '';
  }

}
