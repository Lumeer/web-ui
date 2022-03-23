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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {User} from '../../../../core/store/users/user';
import {ResourceType} from '../../../../core/model/resource-type';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Permissions, Role} from '../../../../core/store/permissions/permissions';
import {Team} from '../../../../core/store/teams/team';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {objectChanged} from '../../../utils/common.utils';

@Component({
  selector: 'user-component',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public deletable: boolean;

  @Input()
  public removable: boolean;

  @Input()
  public changeTeams: boolean;

  @Input()
  public changeRoles: boolean;

  @Input()
  public emitAllChanges: boolean;

  @Input()
  public user: User;

  @Input()
  public teams: Team[];

  @Input()
  public permissions: Permissions;

  @Input()
  public transitiveRoles: Role[];

  @Input()
  public workspace: Workspace;

  @Input()
  public canManageUserDetail: boolean;

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public userRemoved = new EventEmitter<User>();

  @Output()
  public rolesUpdate = new EventEmitter<Role[]>();

  @Output()
  public teamsUpdate = new EventEmitter<string[]>();

  private readonly inheritedManagerMsg: string;
  private readonly cannotChangeRoleMsg: string;
  private readonly deleteMsg: string;
  private readonly deleteTitleMsg: string;

  public userSettingsUrl: string[];
  public userSettingsParams: any;

  constructor(private notificationService: NotificationService) {
    this.deleteMsg = $localize`:@@users.user.delete.message:Do you want to permanently remove this user?`;
    this.deleteTitleMsg = $localize`:@@users.user.delete.title:Remove user?`;
    this.cannotChangeRoleMsg = $localize`:@@users.user.changeRoles:You cannot change these rights. Either you are this user, or you are the last manager here, or you do not have sufficient rights.`;
    this.inheritedManagerMsg = $localize`:@@users.user.inheritedManager:This user is a manager of the organization and their rights cannot be changed. Remove organization manage first.`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || changes.workspace || objectChanged(changes.user)) {
      this.userSettingsUrl = this.buildSettingsUrl();
      this.userSettingsParams = this.buildSettingsParams();
    }
  }

  private buildSettingsUrl(): string[] {
    return ['/o', this.workspace?.organizationCode, 'u', this.user?.id];
  }

  private buildSettingsParams(): any {
    if (this.resourceType === ResourceType.Organization) {
      return {};
    }
    return {projectCode: this.workspace?.projectCode};
  }

  public onDelete() {
    this.notificationService.confirmYesOrNo(this.deleteMsg, this.deleteTitleMsg, 'danger', () => this.deleteUser());
  }

  public deleteUser() {
    this.userDeleted.emit(this.user);
  }

  public onRemove() {
    this.userRemoved.emit(this.user);
  }

  public onTeamsSave(teams: string[]) {
    this.teamsUpdate.emit(teams);
  }
}
