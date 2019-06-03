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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {PivotAttribute, PivotValueAttribute} from '../../../../../../../core/store/pivots/pivot';
import {SelectItemModel} from '../../../../../../../shared/select/select-item/select-item.model';
import {DataAggregationType} from '../../../../../../../shared/utils/data/data-aggregation';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'pivot-value-attribute-config',
  templateUrl: './pivot-value-attribute-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotValueAttributeConfigComponent {
  @Input()
  public pivotAttribute: PivotValueAttribute;

  @Input()
  public availableAttributes: SelectItemModel[];

  @Output()
  public attributeSelect = new EventEmitter<PivotValueAttribute>();

  @Output()
  public attributeChange = new EventEmitter<PivotValueAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly aggregationPlaceholder: string;
  public readonly aggregations = Object.values(DataAggregationType);

  constructor(private i18n: I18n) {
    this.aggregationPlaceholder = i18n({id: 'aggregation', value: 'Aggregation'});
  }

  public onAggregationSelect(aggregation: DataAggregationType) {
    const newAttribute = {...this.pivotAttribute, aggregation};
    this.attributeChange.emit(newAttribute);
  }

  public onAttributeSelected(attribute: PivotAttribute) {
    const valueAttribute = {...attribute, aggregation: DataAggregationType.Sum};
    this.attributeSelect.emit(valueAttribute);
  }

  public onAttributeRemoved() {
    this.attributeRemove.emit();
  }
}
