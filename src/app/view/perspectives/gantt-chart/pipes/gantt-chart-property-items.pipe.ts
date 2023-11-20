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
import {cleanQueryAttribute} from '@lumeer/data-filters';
import {deepObjectsEquals} from '@lumeer/utils';

const sameCollectionProperties = ['start', 'end'];

@Pipe({
  name: 'ganttChartPropertyItems',
})
export class GanttChartPropertyItemsPipe implements PipeTransform {
  public transform(selectItems: SelectItemModel[], property: string, config: GanttChartStemConfig): SelectItemModel[] {
    if (sameCollectionProperties.includes(property)) {
      return this.filterSameResourceItems(selectItems, property, config);
    }

    return selectItems;
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
      const resourceIndex = sameCollectionModels[0].resourceIndex;
      const allowedResourceIndexes =
        resourceIndex % 2 === 0 ? [resourceIndex, resourceIndex - 1] : [resourceIndex, resourceIndex + 1];
      return selectItems.filter(item => {
        const model = item.id as GanttChartBarModel;
        return (
          allowedResourceIndexes.includes(model.resourceIndex) &&
          !sameCollectionModels.some(definedModel =>
            deepObjectsEquals(cleanQueryAttribute(definedModel), cleanQueryAttribute(model))
          )
        );
      });
    }

    return selectItems;
  }
}
