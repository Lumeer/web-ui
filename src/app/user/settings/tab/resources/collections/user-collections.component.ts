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
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {Collection} from '../../../../../core/store/collections/collection';
import {User} from '../../../../../core/store/users/user';
import {userTransitiveRoles} from '../../../../../shared/utils/permission.utils';
import {ResourceType} from '../../../../../core/model/resource-type';
import {ResourceRolesData, resourceRolesDataEmptyTitle, ResourceRolesDatum} from '../list/resource-roles-data';

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

  public readonly resourceType = ResourceType.Collection;

  public data: ResourceRolesData;

  public ngOnChanges(changes: SimpleChanges) {
    this.filter();
  }

  private filter() {
    const objects = (this.collections || [])
      .map(collection => this.computeData(collection))
      .filter(datum => datum.roles.length || datum.transitiveRoles.length);

    const emptyTitle = resourceRolesDataEmptyTitle(ResourceType.Collection, this.isCurrentUser);

    this.data = {objects, emptyTitle};
  }

  private computeData(collection: Collection): ResourceRolesDatum {
    const transitiveRoles = userTransitiveRoles(
      this.organization,
      this.project,
      this.user,
      ResourceType.Collection,
      collection.permissions
    );
    const roles = collection.permissions?.users?.find(role => role.id === this.user.id)?.roles || [];

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
