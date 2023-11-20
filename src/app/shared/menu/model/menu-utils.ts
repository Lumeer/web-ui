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
import {deepObjectsEquals} from '@lumeer/utils';

import {MenuItem} from './menu-item';

export function convertMenuItemsPath<T extends {id: any; children?: T[]}>(menuItemsPath: MenuItem[], items: T[]): T[] {
  const path = [];
  let currentItems = items || [];
  for (const menuItem of menuItemsPath) {
    const item = currentItems.find(i => deepObjectsEquals(i.id, menuItem.id));
    if (item) {
      path.push(item);
      currentItems = item.children || [];
    }
  }

  return path;
}
