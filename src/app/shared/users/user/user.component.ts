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
import {ResourceType} from '../../../core/model/resource-type';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: '[user]',
  templateUrl: './user.component.html',
  styleUrls: ['../../../../styles/custom/_user-roles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public editable: boolean;

  @Input()
  public changeRoles: boolean;

  @Input()
  public user: User;

  @Input()
  public userRoles: string[];

  @Input()
  public groupRoles: string[];

  @Input()
  public inheritedManage: boolean = false;

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public rolesUpdate = new EventEmitter<string[]>();

  private readonly inheritedManagerMsg: string;
  private readonly cannotChangeRoleMsg: string;
  private readonly deleteMsg: string;
  private readonly deleteTitleMsg: string;

  constructor(private notificationService: NotificationService) {
    this.deleteMsg = $localize`:@@users.user.delete.message:Do you want to permanently remove this user?`;
    this.deleteTitleMsg = $localize`:@@users.user.delete.title:Remove user?`;
    this.cannotChangeRoleMsg = $localize`:@@users.user.changeRoles:You cannot change these roles. Either you are this user, or you are the last manager here, or you do not have sufficient rights.`;
    this.inheritedManagerMsg = $localize`:@@users.user.inheritedManager:This user is a manager of the organization and their permissions cannot be changed. Remove organization manage first.`;
  }

  public onDelete() {
    this.notificationService.confirmYesOrNo(this.deleteMsg, this.deleteTitleMsg, 'danger', () => this.deleteUser());
  }

  public deleteUser() {
    this.userDeleted.emit(this.user);
  }

  public toggleRole(role: string) {
    if (!this.changeRoles) {
      if (this.inheritedManage) {
        this.notificationService.info(this.inheritedManagerMsg);
      } else {
        this.notificationService.info(this.cannotChangeRoleMsg);
      }

      return;
    }

    let roles;
    if (this.userRoles.includes(role)) {
      roles = this.userRoles.filter(r => r !== role);
    } else {
      roles = [...this.userRoles, role];
    }

    this.rolesUpdate.emit(roles);
  }
}
