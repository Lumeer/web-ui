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
import {constraintIconsMap, isConstraintTypeEnabled} from '../../../../../core/model/constraint';
import {SelectItemModel} from '../../../../select/select-item/select-item.model';
import {objectValues} from '../../../../utils/common.utils';
import {ConstraintType} from '@lumeer/data-filters';
import {parseSelectTranslation} from '../../../../utils/translation.utils';

@Component({
  selector: 'attribute-type-select',
  templateUrl: './attribute-type-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeSelectComponent implements OnInit {
  @Input()
  public type: ConstraintType;

  @Output()
  public typeChange = new EventEmitter<ConstraintType>();

  public items: SelectItemModel[];

  public ngOnInit() {
    this.items = this.createSelectItems();
  }

  private createSelectItems(): SelectItemModel[] {
    const result: SelectItemModel[] = objectValues(ConstraintType)
      .filter(type => isConstraintTypeEnabled(type))
      .map(type => ({
        id: type,
        value: parseSelectTranslation(
          $localize`:@@constraint.type:{type, select, Address {Address} Boolean {Checkbox} Action {Action} Color {Color} Coordinates {Coordinates} DateTime {Date} FileAttachment {File attachment} Duration {Duration} None {None} Number {Number} Percentage {Percentage} Link {Link} Select {Selection} Text {Text} User {User}}`,
          {type}
        ),
        icons: [constraintIconsMap[type]],
      }));

    result.sort((a, b) => {
      return a.id === ConstraintType.Unknown
        ? -1
        : b.id === ConstraintType.Unknown
        ? 1
        : a.value.localeCompare(b.value);
    });

    return result;
  }

  public onSelect(type: ConstraintType) {
    this.typeChange.emit(type);
  }
}
