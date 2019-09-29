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
import {GanttChartBarModel, GanttChartStemConfig} from '../../../../core/store/gantt-charts/gantt-chart';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';

const sameCollectionProperties = ['start', 'end', 'name', 'color', 'progress'];

@Pipe({
  name: 'ganttChartPropertyItems',
})
export class GanttChartPropertyItemsPipe implements PipeTransform {
  public transform(selectItems: SelectItemModel[], property: string, config: GanttChartStemConfig): SelectItemModel[] {
    if (sameCollectionProperties.includes(property)) {
      return this.filterSameResourceItems(selectItems, property, config);
    }

    return this.filterAnyResourceItems(selectItems, property, config);
  }

  private filterSameResourceItems(
    selectItems: SelectItemModel[],
    property: string,
    config: GanttChartStemConfig
  ): SelectItemModel[] {
    const sameCollectionModels = sameCollectionProperties
      .filter(prop => prop !== property)
      .map(prop => config[prop])
      .filter(model => !!model);

    if (sameCollectionModels.length > 0) {
      return selectItems.filter(item => {
        const model = item.id as GanttChartBarModel;
        return (
          model.resourceIndex === sameCollectionModels[0].resourceIndex &&
          model.resourceId === sameCollectionModels[0].resourceId &&
          !sameCollectionModels.some(definedModel => deepObjectsEquals(definedModel, item.id))
        );
      });
    }

    return this.filterAnyResourceItems(selectItems, property, config);
  }

  private filterAnyResourceItems(
    selectItems: SelectItemModel[],
    property: string,
    config: GanttChartStemConfig
  ): SelectItemModel[] {
    const definedModels = sameCollectionProperties
      .filter(prop => prop !== property)
      .map(prop => config[prop])
      .filter(model => !!model);

    if (definedModels.length > 0) {
      return selectItems.filter(item => !definedModels.some(model => deepObjectsEquals(model, item.id)));
    }

    return selectItems;
  }
}
