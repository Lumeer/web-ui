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

import {Pipe, PipeTransform} from '@angular/core';
import {User} from '../../../../../core/store/users/user';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {userCanReadAllInWorkspace} from '../../../../utils/permission.utils';
import {View} from '../../../../../core/store/views/view';
import {Permissions, Role} from '../../../../../core/store/permissions/permissions';

@Pipe({
  name: 'viewUserPermissions',
})
export class ViewUserPermissionsPipe implements PipeTransform {
  public transform(view: View, roles: Record<string, Role[]>): Permissions {
    const userPermissions = [...(view.permissions?.users || [])];
    Object.keys(roles).forEach(id => {
      const roleIndex = userPermissions.findIndex(role => role.id === id);
      if (roleIndex >= 0) {
        userPermissions[roleIndex] = {id, roles: roles[id]};
      } else {
        userPermissions.push({id, roles: roles[id]});
      }
    });
    return {...view.permissions, users: userPermissions};
  }
}
