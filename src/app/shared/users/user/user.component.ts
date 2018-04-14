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

import {UserModel} from '../../../core/store/users/user.model';
import {Validator} from "../../../core/validators/validator";
import {Role} from '../../../core/model/role';
import {ResourceType} from '../../../core/model/resource-type';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {

  @Input() public resourceType: ResourceType;

  @Input() public editable: boolean;

  @Input() public user: UserModel;

  @Input() public expanded: boolean;

  @Input() public userRoles: string[];

  @Input() public groupRoles: string[];

  @Output() public expandedChange = new EventEmitter();

  @Output() public userUpdated = new EventEmitter<UserModel>();

  @Output() public userDeleted = new EventEmitter<UserModel>();

  @Output() public rolesUpdate = new EventEmitter<string[]>();

  public showEmailWarning: boolean;

  constructor(private i18n: I18n) {
  }

  public onNewEmail(email: string) {
    if (!Validator.validateEmail(email)) {
      this.showEmailWarning = true;
      return;
    }
    this.userUpdated.emit({...this.user, email});
  }

  public onEmailFocus() {
    this.showEmailWarning = false;
  }

  public removeUser() {
    this.userDeleted.emit(this.user);
  }

  public getRoles(): Role[] {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return [Role.Read, Role.Manage, Role.Write];
      case ResourceType.Project:
        return [Role.Read, Role.Manage, Role.Write];
      case ResourceType.Collection:
        return [Role.Read, Role.Manage, Role.Write, Role.Share];
      case ResourceType.View:
        return [Role.Manage, Role.Clone, Role.Read];
      default:
        return [];
    }
  }

  public getIconForRole(role: Role): string {
    switch (role) {
      case Role.Read:
        return 'fa-book';
      case Role.Manage:
        return 'fa-cog';
      case Role.Write:
        return 'fa-pencil';
      case Role.Clone:
        return 'fa-clone';
      case Role.Comment:
        return 'fa-comment-alt';
      case Role.Share:
        return 'fa-share-square';
      default:
        return '';
    }
  }

  public getTitleForRole(role: Role): string {
    return this.i18n({
      id: 'user.permission.icon',
      value: '{role, select, READ {read} MANAGE {manage} WRITE {write} CLONE {clone} COMMENT {comment} SHARE {share}}'
    }, {
      role: role
    });
  }

  public hasRole(role: Role): boolean {
    return this.userRoles.includes(role);
  }

  public toggleRole(role: string) {
    let newRoles;
    if (this.userRoles.includes(role)) {
      newRoles = this.userRoles.filter(r => r !== role)
    } else {
      newRoles = [...this.userRoles, role];
    }
    this.rolesUpdate.emit(newRoles);
  }


}
