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

import {OrganizationModel} from "../organizations/organization.model";
import {isNullOrUndefined} from "util";
import {UserModel} from "./user.model";

export function filterUserFunctions(users: UserModel[]) {
  return users.filter(user => typeof user === 'object');
}

export function filterUsersByOrganization(users: UserModel[], organization: OrganizationModel): UserModel[] {
  if (isNullOrUndefined(organization)) {
    return [];
  }

  return users.filter(user => user.groupsMap[organization.id]);
}

export function filterUsersByFilter(users: UserModel[], filter: string): UserModel[] {
  const filtered = users.slice();
  if (!filter) {
    return filtered;
  }

  const filterTrim = filter.toLowerCase().trim();
  return filtered.filter(user => user.email.toLowerCase().includes(filterTrim));
}
