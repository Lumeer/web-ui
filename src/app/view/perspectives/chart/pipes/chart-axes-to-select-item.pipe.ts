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
import {ChartAxisModel} from '../../../../core/store/charts/chart.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';

@Pipe({
  name: 'chartAxesToSelectItem'
})
export class ChartAxesToSelectItemPipe implements PipeTransform {

  public transform(axes: ChartAxisModel[], collections: CollectionModel[]): SelectItemModel[] {
    return axes.map(axis => this.convertAxisToModel(axis, collections));
  }

  public convertAxisToModel(axis: ChartAxisModel, collections: CollectionModel[]): SelectItemModel {
    const collection = collections.find(coll => coll.id === axis.collectionId);
    const attribute = collection.attributes.find(attr => attr.id === axis.attributeId);
    return {id: axis, value: attribute.name, icon: collection.icon, iconColor: collection.color};
  }

}
