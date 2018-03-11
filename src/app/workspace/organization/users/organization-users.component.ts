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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs/Observable';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {UserModel} from '../../../core/store/users/user.model';
import {selectUsersFilter, selectUsersForWorkspaceAndFilter} from '../../../core/store/users/users.state';
import {filter, map} from 'rxjs/operators';
import {selectAllGroups} from '../../../core/store/groups/groups.state';
import {GroupModel} from '../../../core/store/groups/group.model';
import {UsersAction} from '../../../core/store/users/users.action';
import {Subscription} from "rxjs/Subscription";
import {isNullOrUndefined} from "util";

@Component({
  templateUrl: './organization-users.component.html',
  styleUrls: ['./organization-users.component.scss']
})
export class OrganizationUsersComponent implements OnInit, OnDestroy {

  public users$: Observable<UserModel[]>;
  public groups$: Observable<GroupModel[]>;
  public usersFilter$: Observable<string>;

  public organization: OrganizationModel;

  private organizationSubscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe()
    }
  }

  private sortUsers(users: UserModel[]): UserModel[] {
    return users.sort((user1, user2) => user1.name.localeCompare(user2.name));
  }

  public onUserCreated(user: UserModel) {
    this.store.dispatch(new UsersAction.Create({organizationId: this.organization.id, user: user}));
  }

  public onUserUpdated(user: UserModel) {
    this.store.dispatch(new UsersAction.Update({organizationId: this.organization.id, user: user}));
  }

  public onUserDeleted(user: UserModel) {
    this.store.dispatch(new UsersAction.Delete({organizationId: this.organization.id, userId: user.id}));
  }

  public onUserFilterChanged(value: string) {
    this.store.dispatch(new UsersAction.UpdateFilter({filter: value}));
  }

  private subscribeData() {
    this.organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => this.organization = organization);
    this.users$ = this.store.select(selectUsersForWorkspaceAndFilter).pipe(map(this.sortUsers));
    this.groups$ = this.store.select(selectAllGroups);
    this.usersFilter$ = this.store.select(selectUsersFilter);
  }

}
