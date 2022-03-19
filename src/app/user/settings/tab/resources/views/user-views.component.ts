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

import {Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges} from '@angular/core';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {User} from '../../../../../core/store/users/user';
import {ResourceType} from '../../../../../core/model/resource-type';
import {ResourceRolesData} from '../list/user-resources-list.component';
import {userTransitiveRoles} from '../../../../../shared/utils/permission.utils';
import {View} from '../../../../../core/store/views/view';

@Component({
  selector: 'user-views',
  templateUrl: './user-views.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserViewsComponent implements OnChanges {
  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public user: User;

  @Input()
  public views: View[];

  @Input()
  public loaded: boolean;

  public readonly resourceType = ResourceType.View;

  public data: ResourceRolesData[];

  public ngOnChanges(changes: SimpleChanges) {
    this.filter();
  }

  private filter() {
    this.data = (this.views || [])
      .map(view => this.computeData(view))
      .filter(datum => datum.roles.length || datum.transitiveRoles.length);
  }

  private computeData(view: View): ResourceRolesData {
    const transitiveRoles = userTransitiveRoles(
      this.organization,
      this.project,
      this.user,
      ResourceType.View,
      view.permissions
    );
    const roles = view.permissions?.users?.find(role => role.id === this.user.id)?.roles || [];

    return {roles, transitiveRoles, id: view.id, name: view.name, colors: [view.color], icons: [view.icon]};
  }
}
