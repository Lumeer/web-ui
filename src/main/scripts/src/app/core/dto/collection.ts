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

import {Attribute} from './attribute';
import {Permissions} from './permissions';

export const COLLECTION_NO_ICON = 'fa fa-exclamation-circle';
export const COLLECTION_NO_COLOR = '#cccccc';

export interface Collection {

  code?: string;
  name: string;
  icon: string;
  color: string;
  permissions?: Permissions;
  attributes?: Attribute[];
  defaultAttribute?: Attribute; // TODO implement on backend
  documentsCount?: number;

}
