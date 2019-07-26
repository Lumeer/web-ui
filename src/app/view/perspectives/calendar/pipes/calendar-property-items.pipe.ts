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

import {Pipe, PipeTransform} from '@angular/core';
import {CalendarBar, CalendarBarProperty, CalendarStemConfig} from '../../../../core/store/calendars/calendar';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {AttributesResourceType} from '../../../../core/model/resource';

@Pipe({
  name: 'calendarPropertyItems',
})
export class CalendarPropertyItemsPipe implements PipeTransform {
  public transform(
    collection: Collection,
    property: CalendarBarProperty,
    config: CalendarStemConfig
  ): SelectItemModel[] {
    const restrictedIds = this.getSelectedAttributesIdsInsteadBar(property, config);
    return collection.attributes
      .filter(attribute => !restrictedIds.includes(attribute.id))
      .map(attribute => this.attributeToItem(collection, attribute));
  }

  public getSelectedAttributesIdsInsteadBar(property: CalendarBarProperty, config: CalendarStemConfig): string[] {
    return Object.entries(config.barsProperties || {})
      .filter(entry => entry[0] !== property)
      .map(entry => entry[1].attributeId);
  }

  public attributeToItem(collection: Collection, attribute: Attribute): SelectItemModel {
    const bar: CalendarBar = {
      resourceId: collection.id,
      attributeId: attribute.id,
      resourceIndex: 0,
      resourceType: AttributesResourceType.Collection,
    };
    return {id: bar, value: attribute.name, icons: [collection.icon], iconColors: [collection.color]};
  }
}
