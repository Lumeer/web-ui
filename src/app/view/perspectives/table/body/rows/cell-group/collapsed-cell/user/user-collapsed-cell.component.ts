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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {UserConstraintConfig} from '../../../../../../../../core/model/data/constraint';
import {USER_AVATAR_SIZE} from '../../../../../../../../shared/data-input/user/user-data-input.component';
import {uniqueValues} from '../../../../../../../../shared/utils/array.utils';
import {isEmailValid} from '../../../../../../../../shared/utils/email.utils';

@Component({
  selector: 'user-collapsed-cell',
  templateUrl: './user-collapsed-cell.component.html',
  styleUrls: ['./user-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCollapsedCellComponent implements OnChanges {
  @Input()
  public constraintConfig: UserConstraintConfig;

  @Input()
  public values: any[];

  @Input()
  public stringValues: string[];

  public readonly avatarSize = USER_AVATAR_SIZE;

  public validValues: string[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.values && this.values) {
      this.validValues = this.extractValidValues(this.values);
    }
  }

  private extractValidValues(values: any[]): string[] {
    return uniqueValues(values.filter(value => isEmailValid(value)));
  }
}
