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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {UserModel} from '../../../core/store/users/user.model';
import {GroupModel} from '../../../core/store/groups/group.model';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';

@Component({
  selector: 'user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss'],
})
export class UserGroupsComponent {
  @Input()
  public user: UserModel;

  @Input()
  public groups: GroupModel[];

  @Input()
  public organization: OrganizationModel;

  @Output()
  public userUpdate = new EventEmitter<UserModel>();

  public searchGroupText: string;
  public suggesting: boolean;

  public onBlur() {
    this.suggesting = false;
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onRemoveGroup(group: GroupModel) {
    const userCopy = {...this.user};
    userCopy.groupsMap[this.organization.id] = userCopy.groupsMap[this.organization.id].filter(id => id !== group.id);

    this.userUpdate.emit(userCopy);
  }

  public onSelectedGroup(group: GroupModel) {
    this.searchGroupText = '';
    this.addGroup(group);
  }

  public getSuggestedGroups(): GroupModel[] {
    if (!this.suggesting || !this.searchGroupText) {
      return [];
    }
    const searchTextLowerCase = this.searchGroupText.toLowerCase().trim();
    return this.filterUserGroups().filter(group => group.name.toLowerCase().includes(searchTextLowerCase));
  }

  private filterUserGroups(): GroupModel[] {
    const groupIds = this.user.groupsMap[this.organization.id] || [];
    return this.groups.filter(group => !groupIds.includes(group.id));
  }

  private addGroup(group: GroupModel) {
    const userCopy = {...this.user};
    if (!userCopy.groupsMap[this.organization.id]) {
      userCopy.groupsMap[this.organization.id] = [];
    }
    userCopy.groupsMap[this.organization.id].push(group.id);

    this.userUpdate.emit(userCopy);
  }
}
