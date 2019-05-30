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
import {PivotAnyAttribute} from '../../../../../../core/store/pivots/pivot';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataAggregationType} from '../../../../../../shared/utils/data/data-aggregation';

@Component({
  selector: 'pivot-attribute-config',
  templateUrl: './pivot-attribute-config.component.html',
  styleUrls: ['./pivot-attribute-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PivotAttributeConfigComponent {

  @Input()
  public pivotAttribute: PivotAnyAttribute;

  @Input()
  public availableAttributes: SelectItemModel[];

  @Input()
  public isRow: boolean;

  @Input()
  public isColumn: boolean;

  @Input()
  public isValue: boolean;

  @Output()
  public attributeSelect = new EventEmitter<PivotAnyAttribute>();

  @Output()
  public attributeChange = new EventEmitter<PivotAnyAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly emptyValueString: string;
  public readonly aggregationPlaceholder: string;
  public readonly aggregations = Object.values(DataAggregationType);
  public readonly showSumsId =
    'pivot-show-sums-' +
    Math.random()
      .toString(36)
      .substr(2);

  constructor(private i18n: I18n) {
    this.emptyValueString = i18n({id: 'pivot.config.attribute.empty', value: 'Select attribute'});
    this.aggregationPlaceholder = i18n({id: 'aggregation', value: 'Aggregation'});
  }

  public onAttributeSelected(attribute: PivotAnyAttribute) {
    this.attributeSelect.emit(attribute);
  }

  public onAttributeRemoved() {
    this.attributeRemove.emit();
  }

  public onAggregationSelect(aggregation: DataAggregationType) {
    const newAttribute = {...this.pivotAttribute, aggregation};
    this.attributeChange.emit(newAttribute);
  }

  public onShowSumsChange(checked: boolean) {
    const newAttribute = {...this.pivotAttribute, showSums: checked};
    this.attributeChange.emit(newAttribute);
  }
}
