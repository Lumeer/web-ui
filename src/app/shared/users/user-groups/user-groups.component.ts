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

import {User} from '../../../core/store/users/user';
import {Group} from '../../../core/store/groups/group';
import {Organization} from '../../../core/store/organizations/organization';

@Component({
  selector: 'user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss'],
})
export class UserGroupsComponent {
  @Input()
  public user: User;

  @Input()
  public groups: Group[];

  @Input()
  public organization: Organization;

  @Output()
  public userUpdate = new EventEmitter<User>();

  public searchGroupText: string;
  public suggesting: boolean;

  public onBlur() {
    this.suggesting = false;
  }

  public onFocus() {
    this.suggesting = true;
  }

  public onRemoveGroup(group: Group) {
    const userCopy = {...this.user};
    userCopy.groupsMap[this.organization.id] = userCopy.groupsMap[this.organization.id].filter(id => id !== group.id);

    this.userUpdate.emit(userCopy);
  }

  public onSelectedGroup(group: Group) {
    this.searchGroupText = '';
    this.addGroup(group);
  }

  public getSuggestedGroups(): Group[] {
    if (!this.suggesting || !this.searchGroupText) {
      return [];
    }
    const searchTextLowerCase = this.searchGroupText.toLowerCase().trim();
    return this.filterUserGroups().filter(group => group.name.toLowerCase().includes(searchTextLowerCase));
  }

  private filterUserGroups(): Group[] {
    const groupIds = this.user.groupsMap[this.organization.id] || [];
    return this.groups.filter(group => !groupIds.includes(group.id));
  }

  private addGroup(group: Group) {
    const userCopy = {...this.user};
    if (!userCopy.groupsMap[this.organization.id]) {
      userCopy.groupsMap[this.organization.id] = [];
    }
    userCopy.groupsMap[this.organization.id].push(group.id);

    this.userUpdate.emit(userCopy);
  }
}
