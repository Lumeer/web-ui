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

import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {UserModel} from '../../../core/store/users/user.model';
import {Validator} from "../../../core/validators/validator";

@Component({
  selector: 'user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {

  @Input()
  public organization: OrganizationModel;

  @Input()
  public editable: boolean;

  @Input()
  public user: UserModel;

  @Input()
  public expanded: boolean;

  @Output()
  public expandedChange = new EventEmitter();

  @Output()
  public userUpdated = new EventEmitter<UserModel>();

  @Output()
  public userDeleted = new EventEmitter<UserModel>();

  @Output()
  public permissionsUpdated = new EventEmitter<OrganizationModel>();

  public blocked: boolean;
  public showEmailWarning: boolean;

  public onNewName(name: string) {
    this.userUpdated.emit({...this.user, name});
  }

  public onNewEmail(email: string) {
    if (!Validator.validateEmail(email)) {
      this.showEmailWarning = true;
      return;
    }
    this.userUpdated.emit({...this.user, email});
  }

  public blockUser() {
    this.blocked = !this.blocked;
  }

  public removeUser() {
    this.userDeleted.emit(this.user);
  }

  public onEmailFocus() {
    this.showEmailWarning = false;
  }

}
