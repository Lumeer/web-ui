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

import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs/Observable';
import {selectOrganizationFromUrl} from '../../../core/store/organizations/organizations.state';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {UserModel} from '../../../core/store/users/user.model';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {tap} from 'rxjs/operators';

@Component({
  templateUrl: './organization-users.component.html',
  styleUrls: ['./organization-users.component.scss']
})
export class OrganizationUsersComponent implements OnInit {

  public organization$: Observable<OrganizationModel>;
  public users$: Observable<UserModel[]>;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.organization$ = this.store.select(selectOrganizationFromUrl);
    this.users$ = this.store.select(selectAllUsers).pipe(tap(this.sortUsers));
  }

  private sortUsers(users: UserModel[]): void {
    users.sort((user1, user2) => user1.name.localeCompare(user2.name));
  }

}
