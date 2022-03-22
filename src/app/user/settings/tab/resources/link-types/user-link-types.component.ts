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

import {Component, ChangeDetectionStrategy, Input, SimpleChanges, OnChanges} from '@angular/core';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {User} from '../../../../../core/store/users/user';
import {ResourceType} from '../../../../../core/model/resource-type';
import {
  linkTypePermissions,
  userRolesInProject,
  userTransitiveRoles,
} from '../../../../../shared/utils/permission.utils';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {ResourceRolesData, resourceRolesDataEmptyTitle, ResourceRolesDatum} from '../list/resource-roles-data';
import {RoleType} from '../../../../../core/model/role-type';

@Component({
  selector: 'user-link-types',
  templateUrl: './user-link-types.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLinkTypesComponent implements OnChanges {
  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public user: User;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public loaded: boolean;

  @Input()
  public isCurrentUser: boolean;

  public readonly resourceType = ResourceType.LinkType;

  public data: ResourceRolesData;

  public ngOnChanges(changes: SimpleChanges) {
    this.filter();
  }

  private filter() {
    const objects = (this.linkTypes || [])
      .map(linkType => this.computeData(linkType))
      .filter(datum => datum.roles.length || datum.transitiveRoles.length);

    const emptyTitle = resourceRolesDataEmptyTitle(ResourceType.LinkType, this.isCurrentUser);

    this.data = {objects, emptyTitle};
  }

  private computeData(linkType: LinkType): ResourceRolesDatum {
    const projectRoles = userRolesInProject(this.organization, this.project, this.user);
    let transitiveRoles = [];
    let roles = [];
    if (projectRoles.some(role => role.type === RoleType.Read)) {
      const permissions = linkTypePermissions(linkType);
      transitiveRoles = userTransitiveRoles(
        this.organization,
        this.project,
        this.user,
        ResourceType.LinkType,
        permissions
      );
      roles = permissions?.users?.find(role => role.id === this.user.id)?.roles || [];
    }

    const colors = linkType.collections?.map(c => c.color);
    const icons = linkType.collections?.map(c => c.icon);
    return {roles, transitiveRoles, id: linkType.id, name: linkType.name, colors, icons};
  }
}
