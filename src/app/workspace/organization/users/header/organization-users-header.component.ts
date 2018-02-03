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

import {Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {OrganizationModel} from '../../../../core/store/organizations/organization.model';
import {AppState} from '../../../../core/store/app.state';
import {UserModel} from '../../../../core/store/users/user.model';
import {UsersAction} from '../../../../core/store/users/users.action';

@Component({
  selector: 'organization-users-header',
  templateUrl: './organization-users-header.component.html',
  styleUrls: ['./organization-users-header.component.scss']
})
export class OrganizationUsersHeaderComponent {

  @Input()
  public organization: OrganizationModel;

  constructor(private store: Store<AppState>) {
  }

  public addUser(): void {
    const user: UserModel = {
      email: '',
      name: '',
    };

    this.store.dispatch(new UsersAction.Create({user: user}));
  }

}
