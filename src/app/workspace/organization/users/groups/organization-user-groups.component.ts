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

import {Component, Input, OnInit} from '@angular/core';
import {OrganizationModel} from '../../../../core/store/organizations/organization.model';
import {UserModel} from '../../../../core/store/users/user.model';
import {GroupModel} from '../../../../core/store/groups/group.model';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectAllGroups} from '../../../../core/store/groups/groups.state';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'organization-user-groups',
  templateUrl: './organization-user-groups.component.html',
  styleUrls: ['./organization-user-groups.component.scss']
})
export class OrganizationUserGroupsComponent implements OnInit {

  @Input()
  public organization: OrganizationModel;

  @Input()
  public user: UserModel;

  public groups$: Observable<GroupModel[]>;

  public newGroupName: string;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.groups$ = this.store.select(selectAllGroups);
  }

  public userGroups(user: UserModel, groups: GroupModel[]): GroupModel[] {
    return groups.filter(group => group.users && group.users.includes(user.email));
  }

}
