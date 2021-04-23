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

export interface AllowedPermissions {
  readWithView?: boolean;
  writeWithView?: boolean;
  manageWithView?: boolean;
  read?: boolean;
  write?: boolean;
  manage?: boolean;
  share?: boolean;
}

export type AllowedPermissionsMap = Record<string, AllowedPermissions>;

export function mergeAllowedPermissions(a1: AllowedPermissions, a2: AllowedPermissions): AllowedPermissions {
  if (!a1 || !a2) {
    return a1 || a2;
  }

  return {
    manage: a1.manage && a2.manage,
    manageWithView: a1.manageWithView && a2.manageWithView,
    read: a1.read && a2.read,
    readWithView: a1.readWithView && a2.readWithView,
    write: a1.write && a2.write,
    writeWithView: a1.writeWithView && a2.writeWithView,
    share: a1.share && a2.share,
  };
}
