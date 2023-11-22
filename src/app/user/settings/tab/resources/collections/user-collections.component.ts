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
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import {ResourcePermissionType} from '../../../../../core/model/resource-permission-type';
import {RoleType} from '../../../../../core/model/role-type';
import {Collection} from '../../../../../core/store/collections/collection';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {User} from '../../../../../core/store/users/user';
import {userRolesInProject, userTransitiveRoles} from '../../../../../shared/utils/permission.utils';
import {ResourceRolesData, ResourceRolesDatum, resourceRolesDataEmptyTitle} from '../list/resource-roles-data';

@Component({
  selector: 'user-collections',
  templateUrl: './user-collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCollectionsComponent implements OnChanges {
  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public user: User;

  @Input()
  public collections: Collection[];

  @Input()
  public loaded: boolean;

  @Input()
  public isCurrentUser: boolean;

  public readonly resourcePermissionType = ResourcePermissionType.Collection;

  public data: ResourceRolesData;

  public ngOnChanges(changes: SimpleChanges) {
    this.filter();
  }

  private filter() {
    const objects = (this.collections || [])
      .map(collection => this.computeData(collection))
      .filter(datum => datum.roles.length || datum.transitiveRoles.length);

    const emptyTitle = resourceRolesDataEmptyTitle(ResourcePermissionType.Collection, this.isCurrentUser);

    this.data = {objects, emptyTitle};
  }

  private computeData(collection: Collection): ResourceRolesDatum {
    const projectRoles = userRolesInProject(this.organization, this.project, this.user);
    let transitiveRoles = [];
    let roles = [];
    if (projectRoles.some(role => role.type === RoleType.Read)) {
      transitiveRoles = userTransitiveRoles(
        this.organization,
        this.project,
        this.user,
        ResourcePermissionType.Collection,
        collection.permissions
      );
      roles = collection.permissions?.users?.find(role => role.id === this.user.id)?.roles || [];
    }

    return {
      roles,
      transitiveRoles,
      id: collection.id,
      name: collection.name,
      colors: [collection.color],
      icons: [collection.icon],
    };
  }
}
