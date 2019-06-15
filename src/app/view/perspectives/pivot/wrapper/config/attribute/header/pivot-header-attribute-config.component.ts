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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {
  PivotAttribute,
  PivotColumnAttribute,
  PivotRowAttribute,
  PivotRowColumnAttribute,
  PivotSort,
  PivotSortValue,
} from '../../../../../../../core/store/pivots/pivot';
import {SelectItemModel} from '../../../../../../../shared/select/select-item/select-item.model';
import {cleanPivotAttribute} from '../../../../util/pivot-util';
import {PivotData} from '../../../../util/pivot-data';

@Component({
  selector: 'pivot-header-attribute-config',
  templateUrl: './pivot-header-attribute-config.component.html',
  styleUrls: ['./pivot-header-attribute-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotHeaderAttributeConfigComponent {
  @Input()
  public pivotAttribute: PivotRowColumnAttribute;

  @Input()
  public attributesSelectItems: SelectItemModel[];

  @Input()
  public isRow: boolean;

  @Input()
  public pivotData: PivotData;

  @Output()
  public attributeSelect = new EventEmitter<PivotRowColumnAttribute>();

  @Output()
  public attributeChange = new EventEmitter<PivotRowColumnAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly showSumsId =
    'pivot-show-sums-' +
    Math.random()
      .toString(36)
      .substr(2);

  public onShowSumsChange(checked: boolean) {
    const newAttribute = {...this.pivotAttribute, showSums: checked};
    this.attributeChange.emit(newAttribute);
  }

  public onAttributeSelected(attribute: PivotAttribute) {
    const headerAttribute: PivotRowColumnAttribute = {...attribute, showSums: true, sort: {attribute, asc: true}};
    this.attributeSelect.emit(headerAttribute);
  }

  public onAttributeRemoved() {
    this.attributeRemove.emit();
  }
}
