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

import {Pipe, PipeTransform} from '@angular/core';
import {isNullOrUndefined} from 'util';
import {containsSameElements} from '../../shared/utils/array.utils';

@Pipe({
  name: 'viewPermissionsChanged',
})
export class ViewPermissionsChangedPipe implements PipeTransform {
  public transform(
    initialUserPermissions: {[id: string]: string[]},
    currentUserPermissions: {[id: string]: string[]}
  ): boolean {
    if (Object.keys(initialUserPermissions).length !== Object.keys(currentUserPermissions).length) {
      return true;
    }

    for (const id of Object.keys(initialUserPermissions)) {
      const currentRoles = currentUserPermissions[id];
      const userRoles = initialUserPermissions[id];
      if (isNullOrUndefined(currentRoles) || !containsSameElements(currentRoles, userRoles)) {
        return true;
      }
    }

    return false;
  }
}
