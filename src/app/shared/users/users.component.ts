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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {MemoizedSelector, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {Observable, Subscription} from 'rxjs';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {UserModel} from '../../core/store/users/user.model';
import {filter, map, tap} from 'rxjs/operators';
import {UsersAction} from '../../core/store/users/users.action';
import {isNullOrUndefined} from 'util';
import {selectCurrentUserForWorkspace, selectUsersForWorkspace} from '../../core/store/users/users.state';
import {ResourceType} from '../../core/model/resource-type';
import {ResourceModel} from '../../core/model/resource.model';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {PermissionModel, PermissionsModel, PermissionType} from '../../core/store/permissions/permissions.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {CollectionsAction} from '../../core/store/collections/collections.action';

@Component({
  selector: 'users',
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit, OnDestroy {
  @Input() public resourceType: ResourceType;

  public users$: Observable<UserModel[]>;

  public currentUser$: Observable<UserModel>;

  public organizationId: string;

  public resourceId: string;

  public resource$: Observable<ResourceModel>;

  private organizationSubscription: Subscription;

  constructor(private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }
  }

  private sortUsers(users: UserModel[]): UserModel[] {
    return users.sort((user1, user2) => user1.email.localeCompare(user2.email));
  }

  public onNewUser(email: string) {
    const user: UserModel = {email, groupsMap: {}};
    user.groupsMap[this.organizationId] = [];

    this.store.dispatch(new UsersAction.Create({organizationId: this.organizationId, user}));
  }

  public onUserUpdated(user: UserModel) {
    this.store.dispatch(new UsersAction.Update({organizationId: this.organizationId, user}));
  }

  public onUserDeleted(user: UserModel) {
    this.store.dispatch(new UsersAction.Delete({organizationId: this.organizationId, userId: user.id}));
  }

  public onUserPermissionChanged(data: {
    newPermission: PermissionModel;
    currentPermission: PermissionModel;
    onlyStore: boolean;
  }) {
    if (data.onlyStore) {
      this.changeUserPermissionOnlyStore(data);
    } else {
      this.changeUserPermission(data);
    }
  }

  public changeUserPermissionOnlyStore(data: {newPermission: PermissionModel}) {
    const payload = {type: PermissionType.Users, permission: data.newPermission};
    switch (this.resourceType) {
      case ResourceType.Organization: {
        this.store.dispatch(
          new OrganizationsAction.ChangePermissionSuccess({...payload, organizationId: this.resourceId})
        );
        break;
      }
      case ResourceType.Project: {
        this.store.dispatch(new ProjectsAction.ChangePermissionSuccess({...payload, projectId: this.resourceId}));
        break;
      }
      case ResourceType.Collection: {
        this.store.dispatch(new CollectionsAction.ChangePermissionSuccess({...payload, collectionId: this.resourceId}));
        break;
      }
    }
  }

  public changeUserPermission(data: {newPermission: PermissionModel; currentPermission: PermissionModel}) {
    const payload = {
      type: PermissionType.Users,
      permission: data.newPermission,
      currentPermission: data.currentPermission,
    };
    switch (this.resourceType) {
      case ResourceType.Organization: {
        this.store.dispatch(new OrganizationsAction.ChangePermission({...payload, organizationId: this.resourceId}));
        break;
      }
      case ResourceType.Project: {
        this.store.dispatch(new ProjectsAction.ChangePermission({...payload, projectId: this.resourceId}));
        break;
      }
      case ResourceType.Collection: {
        this.store.dispatch(new CollectionsAction.ChangePermission({...payload, collectionId: this.resourceId}));
        break;
      }
    }
  }

  private subscribeData() {
    this.organizationSubscription = this.store
      .select(selectOrganizationByWorkspace)
      .pipe(
        filter(organization => !isNullOrUndefined(organization)),
        map(organization => organization.id)
      )
      .subscribe(organizationId => (this.organizationId = organizationId));
    this.users$ = this.store.select(selectUsersForWorkspace).pipe(map(this.sortUsers));
    this.currentUser$ = this.store.select(selectCurrentUserForWorkspace);

    this.resource$ = this.store.select(this.getSelector()).pipe(
      filter(resource => !isNullOrUndefined(resource)),
      tap(resource => (this.resourceId = resource.id))
    );
  }

  private getSelector(): MemoizedSelector<AppState, ResourceModel> {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return selectOrganizationByWorkspace;
      case ResourceType.Project:
        return selectProjectByWorkspace;
      case ResourceType.Collection:
        return selectCollectionByWorkspace;
      // TODO case ResourceType.View: return selectViewByWorkspace
    }
  }
}
