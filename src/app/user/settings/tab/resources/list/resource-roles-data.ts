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

import {Role} from '../../../../../core/store/permissions/permissions';
import {parseSelectTranslation} from '../../../../../shared/utils/translation.utils';
import {ResourcePermissionType} from '../../../../../core/model/resource-permission-type';

export interface ResourceRolesData {
  objects: ResourceRolesDatum[];
  emptyTitle: string;
}

export interface ResourceRolesDatum {
  id: string;
  name: string;
  icons: string[];
  colors: string[];
  roles: Role[];
  transitiveRoles: Role[];
}

export function resourceRolesDataEmptyTitle(resourceType: ResourcePermissionType, isCurrent: boolean): string {
  if (isCurrent) {
    return parseSelectTranslation(
      $localize`:@@user.resources.empty.current:You do not not have right to see nor access any {type, select, project {project} collection {table} view {view} link_type {link type}}`,
      {type: resourceType}
    );
  } else {
    return parseSelectTranslation(
      $localize`:@@user.resources.empty.other:This user does not have right to see nor access any {type, select, project {project} collection {table} view {view} link_type {link type}}`,
      {type: resourceType}
    );
  }
}
