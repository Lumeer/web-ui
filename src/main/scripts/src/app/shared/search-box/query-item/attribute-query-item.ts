/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
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
