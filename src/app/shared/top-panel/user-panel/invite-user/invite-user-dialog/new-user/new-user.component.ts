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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {KeyCode} from '../../../../../key-code';

@Component({
  selector: 'new-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewUserComponent {
  @Input()
  public users: string[];

  @Input()
  public existingUsers: string[];

  @Output()
  public userCreated = new EventEmitter<string>();

  public email: string;
  public isDuplicate: boolean = false;

  constructor(private i18n: I18n) {}

  public onAddUser() {
    if (this.existingUsers.indexOf(this.email) < 0) {
      this.addUser();
    }
  }

  private addUser() {
    this.userCreated.emit(this.email);
    this.clearInputs();
  }

  public onInputChanged(value: string) {
    this.email = value;
    this.checkDuplicates();
  }

  public checkDuplicates() {
    this.isDuplicate =
      !!this.users.find(user => user === this.email) || !!this.existingUsers.find(user => user === this.email);
  }

  private clearInputs() {
    this.email = '';
  }

  public emailPlaceHolder(): string {
    return this.i18n({
      id: 'inviteUser.dialog.input.add.placeholder',
      value: 'Enter an email and press Enter',
    });
  }

  public onKeyPress($event: KeyboardEvent) {
    if (!this.isDuplicate && $event.code === KeyCode.Enter) {
      this.addUser();
      $event.stopImmediatePropagation();
      $event.preventDefault();
    }
  }
}
