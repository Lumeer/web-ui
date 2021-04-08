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
import {User} from '../../../core/store/users/user';
import {removeAccentFromString} from '@lumeer/data-filters';

@Component({
  selector: 'new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserComponent {
  @Input()
  public users: User[];

  @Output()
  public userCreated = new EventEmitter<string>();

  public email: string;
  public isDuplicate: boolean = false;

  public onAddUser() {
    this.userCreated.emit(this.email);
    this.clearInputs();
  }

  public onInputChanged(value: string) {
    this.email = value;
    this.checkDuplicates();
  }

  public checkDuplicates() {
    const emailCleaned = removeAccentFromString(this.email, true).trim();
    this.isDuplicate = !!this.users.find(user => removeAccentFromString(user.email, true) === emailCleaned);
  }

  private clearInputs() {
    this.email = '';
  }

  public emailPlaceHolder(): string {
    return $localize`:@@user.add.placeholder:Type email to invite another user`;
  }
}
