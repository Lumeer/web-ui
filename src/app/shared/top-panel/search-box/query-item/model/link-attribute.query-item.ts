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
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {LinkAttributeFilter} from '../../../../../core/store/navigation/query/query';
import {isNotNullOrUndefined} from '../../../../utils/common.utils';
import {ConditionType, ConditionValue} from '@lumeer/data-filters';

export class LinkAttributeQueryItem implements QueryItem {
  public type = QueryItemType.LinkAttribute;

  public constructor(
    public linkType: LinkType,
    public attribute: Attribute,
    public condition?: ConditionType,
    public conditionValues?: ConditionValue[],
    public fromSuggestion?: boolean
  ) {}

  public get icons(): string[] {
    return this.notNullCollections().map(collection => collection.icon);
  }

  public get colors(): string[] {
    return this.notNullCollections().map(collection => collection.color);
  }

  public get collectionIds(): string[] {
    return this.notNullCollections().map(collection => collection.id);
  }

  private notNullCollections(): Collection[] {
    return this.linkType.collections?.filter(collection => !!collection) || [];
  }

  public get text(): string {
    return this.attribute.name;
  }

  public get value() {
    return `${this.linkType.id}:${this.attribute.id}:${this.condition || ''}:${this.conditionValuesString()}`;
  }

  private conditionValuesString(): string {
    return (this.conditionValues || [])
      .map(item => item.type || item.value)
      .filter(item => isNotNullOrUndefined(item))
      .join(':');
  }

  public getLinkAttributeFilter(): LinkAttributeFilter {
    return {
      linkTypeId: this.linkType.id,
      attributeId: this.attribute.id,
      condition: this.condition,
      conditionValues: this.conditionValues,
    };
  }
}
