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
import {Team} from '../../../core/store/teams/team';
import {InputBoxComponent} from '../../input/input-box/input-box.component';
import {Permissions, Role} from '../../../core/store/permissions/permissions';

@Component({
  selector: 'team-component',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamComponent {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public permissions: Permissions;

  @Input()
  public users: User[];

  @Input()
  public team: Team;

  @Input()
  public editable: boolean;

  @Input()
  public changeRoles: boolean;

  @Input()
  public allTeams: Team[];

  @Output()
  public teamUpdated = new EventEmitter<Team>();

  @Output()
  public teamDeleted = new EventEmitter<Team>();

  @Output()
  public teamRolesChange = new EventEmitter<Role[]>();

  private readonly inheritedManagerMsg: string;
  private readonly cannotChangeRoleMsg: string;
  private readonly deleteMsg: string;
  private readonly deleteTitleMsg: string;

  constructor(private notificationService: NotificationService) {
    this.deleteMsg = $localize`:@@groups.group.delete.message:Do you want to permanently remove this group?`;
    this.deleteTitleMsg = $localize`:@@groups.group.delete.title:Remove group?`;
    this.cannotChangeRoleMsg = $localize`:@@users.user.changeRoles:You cannot change these roles. Either you are this user, or you are the last manager here, or you do not have sufficient rights.`;
    this.inheritedManagerMsg = $localize`:@@users.user.inheritedManager:This user is a manager of the organization and their permissions cannot be changed. Remove organization manage first.`;
  }

  public onDelete() {
    this.notificationService.confirmYesOrNo(this.deleteMsg, this.deleteTitleMsg, 'danger', () => this.deleteTeam());
  }

  public deleteTeam() {
    this.teamDeleted.emit(this.team);
  }

  public onUsersSave(users: string[]) {
    this.teamUpdated.emit({...this.team, users});
  }

  public onNewName(name: string, nameInput: InputBoxComponent) {
    const teamWithName = this.allTeams?.some(t => t.name === name && t.id !== this.team.id);
    if (teamWithName) {
      const warning = $localize`:@@teams.team.name.existing:I am sorry, the team '${name}:name:' already exists.`;
      this.notificationService.warning(warning);
      nameInput.setValue(this.team.name);
    } else {
      this.teamUpdated.emit({...this.team, name});
    }
  }

  public onNewDescription(description: string) {
    this.teamUpdated.emit({...this.team, description});
  }

  public onChangeRoles(roles: Role[]) {
    this.teamRolesChange.emit(roles);
  }
}
