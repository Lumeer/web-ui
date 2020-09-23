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
import {ChartAxis, ChartAxisType, ChartConfig} from '../../../../../core/store/charts/chart';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {objectValues} from '../../../../../shared/utils/common.utils';

@Pipe({
  name: 'axisRestrictedIds',
})
export class AxisRestrictedIdsPipe implements PipeTransform {
  public transform(axisType: ChartAxisType, config: ChartConfig, isDataSet?: boolean): SelectItemWithConstraintId[] {
    const namesEntries: Record<ChartAxisType, ChartAxis> = {
      [ChartAxisType.X]: config.axes?.x?.name,
      [ChartAxisType.Y1]: config.axes?.y1?.name,
      [ChartAxisType.Y2]: config.axes?.y2?.name,
    };

    const axisEntries: Record<ChartAxisType, ChartAxis> = {
      [ChartAxisType.X]: config.axes?.x?.axis,
      [ChartAxisType.Y1]: config.axes?.y1?.axis,
      [ChartAxisType.Y2]: config.axes?.y2?.axis,
    };

    if (isDataSet) {
      return [
        ...Object.entries(namesEntries)
          .filter(entry => entry[0] !== axisType && entry[1])
          .map(entry => entry[1]),
        ...objectValues(axisEntries).filter(axis => !!axis),
      ].map(axis => ({attributeId: axis.attributeId, resourceIndex: axis.resourceIndex}));
    } else {
      return [
        ...Object.entries(axisEntries)
          .filter(entry => entry[0] !== axisType && entry[1])
          .map(entry => entry[1]),
        ...objectValues(namesEntries).filter(axis => !!axis),
      ].map(axis => ({attributeId: axis.attributeId, resourceIndex: axis.resourceIndex}));
    }
  }
}
