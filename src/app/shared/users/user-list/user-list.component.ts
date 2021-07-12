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

import {User} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Role} from '../../../core/store/permissions/permissions';
import {Resource} from '../../../core/model/resource';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {Team} from '../../../core/store/teams/team';
import {BehaviorSubject} from 'rxjs';
import {ServiceLimits} from '../../../core/store/organizations/service-limits/service.limits';
import {userHasRoleInOrganization, userHasRoleInProject, userHasRoleInResource} from '../../utils/permission.utils';
import {RoleType} from '../../../core/model/role-type';
import {NotificationButton} from '../../../core/notifications/notification-button';
import {NotificationService} from '../../../core/notifications/notification.service';
import {deepObjectCopy} from '../../utils/common.utils';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public users: User[];

  @Input()
  public teams: Team[];

  @Input()
  public currentUser: User;

  @Input()
  public resource: Resource;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public serviceLimits: ServiceLimits;

  @Output()
  public userCreated = new EventEmitter<string>();

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public userRolesChange = new EventEmitter<{user: User; roles: Role[]}>();

  @Output()
  public userTeamsChange = new EventEmitter<{user: User; teams: string[]}>();

  public teams$ = new BehaviorSubject<Team[]>([]);

  public deletableUserIds: string[];
  public editableUserIds: string[];

  constructor(private notificationService: NotificationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.users || changes.resourceType || changes.currentUser) {
      this.checkUserIds();
    }
    if (changes.teams) {
      this.teams$.next(this.teams);
    }
  }

  private checkUserIds() {
    if (this.resourceType === ResourceType.Organization) {
      this.deletableUserIds = (this.users || []).filter(user => user.id !== this.currentUser.id).map(user => user.id);
    } else {
      this.deletableUserIds = [];
    }
    this.editableUserIds = (this.users || []).filter(user => user.id !== this.currentUser.id).map(user => user.id);
  }

  public onUserRolesChanged(user: User, roles: Role[]) {
    this.userRolesChange.emit({user, roles});
  }

  public onUserTeamsChange(data: {user: User; teams: string[]}) {
    if (data.user.id === this.currentUser.id) {
      const userTeams = (this.teams || []).filter(team => data.teams.includes(team.id));
      const userWithTeams = {...data.user, teams: userTeams};
      if (this.userLostUserConfig(this.organization, this.project, this.resource, userWithTeams)) {
        this.askToPerformUpdate(
          () => this.userTeamsChange.emit(data),
          () => this.resetTeams()
        );
        return;
      }
    }

    this.userTeamsChange.emit(data);
  }

  private resetTeams() {
    this.teams$.next(deepObjectCopy(this.teams));
  }

  private askToPerformUpdate(confirm: () => void, cancel?: () => void) {
    const message = $localize`:@@teams.list.lost.permissions.message:By confirming this action, you will lose the rights to manage users and teams and will not be able to revert it back.`;
    const title = $localize`:@@teams.list.lost.permissions.title:Be careful, there is risk of losing access.`;
    const yesButton = {text: $localize`:@@teams.list.lost.permissions.confirm:Save anyway`, action: confirm};
    const noButton = {text: $localize`:@@teams.list.lost.permissions.close:Cancel`, action: cancel};

    const buttons: NotificationButton[] = [noButton, yesButton];

    this.notificationService.confirm(message, title, buttons, 'warning');
  }

  private userLostUserConfig(organization: Organization, project: Project, resource: Resource, user: User): boolean {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return !userHasRoleInOrganization(resource, user, RoleType.UserConfig);
      case ResourceType.Project:
        return !userHasRoleInProject(organization, resource, user, RoleType.UserConfig);
      default:
        return !userHasRoleInResource(organization, project, resource, user, RoleType.UserConfig);
    }
  }
}
