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

import {Pipe, PipeTransform} from '@angular/core';
import {ChartAxis, ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';

@Pipe({
  name: 'axisSelectItems',
})
export class AxisSelectItemsPipe implements PipeTransform {
  public transform(collections: Collection[], axis: ChartAxisType, config: ChartConfig): SelectItemModel[] {
    const selectedAttributesIdsInsteadAxis = this.getSelectedAttributesIdsInsteadAxis(axis, config);
    return collections
      .filter(collection => !!collection)
      .reduce((items, collection) => {
        const itemsForCollection = this.getItemsForCollection(collection, selectedAttributesIdsInsteadAxis);
        return [...items, ...itemsForCollection];
      }, []);
  }

  public getSelectedAttributesIdsInsteadAxis(axis: ChartAxisType, config: ChartConfig): string[] {
    return Object.entries(config.axes)
      .filter(entry => entry[0] !== axis)
      .map(entry => entry[1].attributeId);
  }

  public getItemsForCollection(collection: Collection, restrictedIds: string[]): SelectItemModel[] {
    return collection.attributes
      .filter(attribute => !restrictedIds.includes(attribute.id))
      .map(attribute => this.attributeToItem(collection, attribute));
  }

  public attributeToItem(collection: Collection, attribute: Attribute): SelectItemModel {
    const axis: ChartAxis = {collectionId: collection.id, attributeId: attribute.id};
    return {id: axis, value: attribute.name, icon: collection.icon, iconColor: collection.color};
  }
}
