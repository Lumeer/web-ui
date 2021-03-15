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
import {Role} from '../../core/model/role';
import {parseSelectTranslation} from '../utils/translation.utils';

@Pipe({
  name: 'roleHumanReadable',
})
export class RoleHumanReadablePipe implements PipeTransform {
  public transform(roles: string[]): string {
    let roleText = Role.Empty;

    if (roles.findIndex(role => role === Role.Manage) >= 0) {
      roleText = Role.Manage;
    } else if (roles.findIndex(role => role === Role.Write) >= 0) {
      roleText = Role.Write;
    } else if (roles.findIndex(role => role === Role.Read) >= 0) {
      roleText = Role.Read;
    }

    return parseSelectTranslation(
      $localize`:@@user.permission.humanName:{role, select, READ {Reader} MANAGE {Creator} WRITE {Author} EMPTY {No role assigned}}`,
      {role: roleText}
    );
  }
}
