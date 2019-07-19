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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {constraintIconsMap, ConstraintType, isConstraintTypeEnabled} from '../../../../core/model/data/constraint';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'attribute-type-select',
  templateUrl: './attribute-type-select.component.html',
  styleUrls: ['./attribute-type-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeSelectComponent implements OnInit {
  @Input()
  public type: ConstraintType;

  @Output()
  public typeChange = new EventEmitter<ConstraintType>();

  public items: SelectItemModel[];

  constructor(private i18n: I18n) {}

  public ngOnInit() {
    this.items = this.createSelectItems();
  }

  private createSelectItems(): SelectItemModel[] {
    return ['None'].concat(Object.keys(ConstraintType).filter(type => isConstraintTypeEnabled(type))).map(type => ({
      id: type,
      value: this.i18n(
        '{type, select, Address {Address} Boolean {Checkbox} Color {Color} Coordinates {Coordinates} DateTime {Date} Duration {Duration} None {None} Number {Number} Percentage {Percentage} Select {Selection} Text {Text} User {User}}',
        {type}
      ),
      icons: [constraintIconsMap[type] || 'fas fa-times'],
    }));
  }

  public onSelect(type: ConstraintType) {
    this.typeChange.emit(type);
  }
}
