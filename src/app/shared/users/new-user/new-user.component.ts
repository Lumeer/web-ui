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

import {Component, EventEmitter, Output} from '@angular/core';

import {Validator} from "../../../core/validators/validator";

@Component({
  selector: 'new-user',
  templateUrl: './new-user.component.html'
})
export class NewUserComponent {

  @Output() public userCreated = new EventEmitter<string>();

  public email: string;
  public showEmailWarning: boolean = false;

  public onAddUser() {
    if (!this.email || !Validator.validateEmail(this.email)) {
      this.showEmailWarning = true;
      return;
    }
    this.addUser();
  }

  public onEmailFocus() {
    this.showEmailWarning = false;
  }

  private addUser() {
    this.userCreated.emit(this.email);
    this.clearInputs();
  }

  private clearInputs() {
    this.email = '';
  }

}
