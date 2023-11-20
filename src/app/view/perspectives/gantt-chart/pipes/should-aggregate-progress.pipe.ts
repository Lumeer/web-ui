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

import {isNotNullOrUndefined} from '@lumeer/utils';

import {GanttChartStemConfig} from '../../../../core/store/gantt-charts/gantt-chart';

@Pipe({
  name: 'shouldAggregateProgress',
})
export class ShouldAggregateProgressPipe implements PipeTransform {
  public transform(config: GanttChartStemConfig): boolean {
    if (!config || !config.progress) {
      return false;
    }

    const resourceIndex = config.progress.resourceIndex;
    const allowedResourceIndexes =
      resourceIndex % 2 === 0 ? [resourceIndex, resourceIndex - 1] : [resourceIndex, resourceIndex + 1];

    return [config.start, config.end]
      .filter(model => isNotNullOrUndefined(model))
      .some(model => !allowedResourceIndexes.includes(model.resourceIndex));
  }
}
