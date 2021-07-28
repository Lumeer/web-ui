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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DataAggregationType} from '../../../../../../../shared/utils/data/data-aggregation';
import {KanbanAggregation, KanbanValueType} from '../../../../../../../core/store/kanbans/kanban';
import {objectValues} from '../../../../../../../shared/utils/common.utils';

@Component({
  selector: 'kanban-aggregation-config',
  templateUrl: './kanban-aggregation-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanAggregationConfigComponent {
  @Input()
  public aggregation: KanbanAggregation;

  @Output()
  public aggregationChange = new EventEmitter<KanbanAggregation>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly aggregationPlaceholder: string;
  public readonly aggregations = objectValues(DataAggregationType);
  public readonly valueTypes = objectValues(KanbanValueType);
  public readonly valueType = KanbanValueType;
  public readonly aggregationType = DataAggregationType;

  constructor() {
    this.aggregationPlaceholder = $localize`:@@aggregation:Aggregation`;
  }

  public onAggregationSelect(aggregation: DataAggregationType) {
    const newAggregation = {...(this.aggregation || {}), aggregation};
    this.aggregationChange.emit(newAggregation);
  }

  public onValueTypeSelected(valueType: KanbanValueType) {
    const newAggregation = {...(this.aggregation || {}), valueType};
    this.aggregationChange.emit(newAggregation);
  }
}
