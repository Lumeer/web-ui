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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';

import {MemoizedSelector, select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {User} from '../../core/store/users/user';
import {filter, map, tap} from 'rxjs/operators';
import {UsersAction} from '../../core/store/users/users.action';
import {selectCurrentUserForWorkspace, selectUsersForWorkspace} from '../../core/store/users/users.state';
import {ResourceType} from '../../core/model/resource-type';
import {Resource} from '../../core/model/resource';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {Permission, PermissionType} from '../../core/store/permissions/permissions';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';
import {Workspace} from '../../core/store/navigation/workspace';
import {Angulartics2} from 'angulartics2';
import mixpanel from 'mixpanel-browser';
import {ConfigurationService} from '../../configuration/configuration.service';

@Component({
  selector: 'users',
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent implements OnInit, OnDestroy {
  @Input() public resourceType: ResourceType;

  public users$: Observable<User[]>;
  public currentUser$: Observable<User>;
  public organization$ = new BehaviorSubject<Organization>(null);
  public project$ = new BehaviorSubject<Project>(null);
  public resource$: Observable<Resource>;

  private resourceId: string;
  private subscriptions = new Subscription();

  constructor(
    private store$: Store<AppState>,
    private angulartics2: Angulartics2,
    private configurationService: ConfigurationService
  ) {}

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private sortUsers(users: User[]): User[] {
    return users.sort((user1, user2) => user1.email.localeCompare(user2.email));
  }

  public onNewUser(email: string) {
    const user: User = {email, groupsMap: {}};
    user.groupsMap[this.getOrganizationId()] = [];

    this.store$.dispatch(new UsersAction.Create({organizationId: this.getOrganizationId(), user}));

    if (this.configurationService.getConfiguration().analytics && this.resourceType === ResourceType.Organization) {
      this.angulartics2.eventTrack.next({
        action: 'User invite',
        properties: {
          category: 'Collaboration',
        },
      });

      if (this.configurationService.getConfiguration().mixpanelKey) {
        mixpanel.track('User Invite', {user: email});
      }
    }
  }

  public onUserUpdated(user: User) {
    this.store$.dispatch(new UsersAction.Update({organizationId: this.getOrganizationId(), user}));
  }

  public onUserDeleted(user: User) {
    this.store$.dispatch(new UsersAction.Delete({organizationId: this.getOrganizationId(), userId: user.id}));
  }

  private getOrganizationId(): string {
    const organization = this.organization$.getValue();
    return organization && organization.id;
  }

  public changeUsersPermissionsOnlyStore(data: {permissions: Permission[]}) {
    const payload = {...data, type: PermissionType.Users};
    switch (this.resourceType) {
      case ResourceType.Organization: {
        this.store$.dispatch(
          new OrganizationsAction.ChangePermissionSuccess({...payload, organizationId: this.resourceId})
        );
        break;
      }
      case ResourceType.Project: {
        this.store$.dispatch(new ProjectsAction.ChangePermissionSuccess({...payload, projectId: this.resourceId}));
        break;
      }
      case ResourceType.Collection: {
        this.store$.dispatch(
          new CollectionsAction.ChangePermissionSuccess({...payload, collectionId: this.resourceId})
        );
        break;
      }
    }
  }

  public changeUsersPermissions(data: {
    permissions: Permission[];
    currentPermissions: Permission[];
    workspace?: Workspace;
  }) {
    const payload = {...data, type: PermissionType.Users};
    switch (this.resourceType) {
      case ResourceType.Organization: {
        this.store$.dispatch(new OrganizationsAction.ChangePermission({...payload, organizationId: this.resourceId}));
        break;
      }
      case ResourceType.Project: {
        this.store$.dispatch(new ProjectsAction.ChangePermission({...payload, projectId: this.resourceId}));
        break;
      }
      case ResourceType.Collection: {
        this.store$.dispatch(new CollectionsAction.ChangePermission({...payload, collectionId: this.resourceId}));
        break;
      }
    }
  }

  private subscribeData() {
    const subscription = this.store$
      .pipe(
        select(selectWorkspaceModels),
        filter(models => !!models.organization)
      )
      .subscribe(models => {
        this.organization$.next(models.organization);
        this.project$.next(models.project);
      });
    this.subscriptions.add(subscription);

    this.users$ = this.store$.pipe(select(selectUsersForWorkspace), map(this.sortUsers));

    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));

    this.resource$ = this.store$.pipe(
      select(this.getSelector()),
      filter(resource => !!resource),
      tap(resource => (this.resourceId = resource.id))
    );
  }

  private getSelector(): MemoizedSelector<AppState, Resource> {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return selectOrganizationByWorkspace;
      case ResourceType.Project:
        return selectProjectByWorkspace;
      case ResourceType.Collection:
        return selectCollectionByWorkspace;
    }
  }
}
