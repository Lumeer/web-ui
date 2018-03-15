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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {UserModel} from '../../../../core/store/users/user.model';
import {OrganizationModel} from "../../../../core/store/organizations/organization.model";
import {Validator} from "../../../../core/validators/validator";

@Component({
  selector: 'organization-new-user',
  templateUrl: './organization-new-user.component.html',
  styleUrls: ['./organization-new-user.component.scss']
})
export class OrganizationNewUserComponent {

  @Input()
  public organization: OrganizationModel;

  @Output()
  public userCreated = new EventEmitter<UserModel>();

  public name: string;
  public email: string;
  public showNameWarning: boolean = false;
  public showEmailWarning: boolean = false;

  public onAddUser() {
    if (!this.name) {
      this.showNameWarning = true;
      return;
    }
    if (!this.email || !Validator.validateEmail(this.email)) {
      this.showEmailWarning = true;
      return;
    }
    this.addUser();
  }

  public onNameFocus() {
    this.showNameWarning = false;
  }

  public onEmailFocus() {
    this.showEmailWarning = false;
  }

  private addUser() {
    const newUser: UserModel = {
      name: this.name,
      email: this.email,
      groupsMap: {}
    };
    newUser.groupsMap[this.organization.id] = [];

    this.userCreated.emit(newUser);

    this.clearInputs();
  }

  private clearInputs() {
    this.name = '';
    this.email = '';
  }

}
