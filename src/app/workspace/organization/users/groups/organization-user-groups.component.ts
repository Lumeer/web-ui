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
import {UserModel} from '../../../../core/store/users/user.model';
import {GroupModel} from '../../../../core/store/groups/group.model';

@Component({
  selector: 'organization-user-groups',
  templateUrl: './organization-user-groups.component.html',
  styleUrls: ['./organization-user-groups.component.scss']
})
export class OrganizationUserGroupsComponent {

  @Input()
  public user: UserModel;

  @Input()
  public groups: GroupModel[];

  @Output()
  public groupAdded = new EventEmitter<GroupModel>();

  public newGroupName: string;

  public addGroup() {
    const newGroup: GroupModel = {name: this.newGroupName};
    this.user.groups.push(newGroup);

    this.groupAdded.emit(this.user);
    this.newGroupName = '';
  }

}
