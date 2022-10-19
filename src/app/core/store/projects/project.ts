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

import {Resource} from '../../model/resource';
import {RoleType} from '../../model/role-type';

export interface Project extends Resource {
  organizationId?: string;
  collectionsCount?: number;
  templateMetadata?: TemplateMetadata;
  isPublic?: boolean;
}

export interface TemplateMetadata {
  imageUrl?: string;
  defaultView?: string;
  allowedDomains?: string;
  relativeDate?: Date;
  template?: boolean;
  editable?: boolean;
  tags?: string[];
  showTopPanel?: boolean;
  organizationId?: string;
}

export const projectRoleTypes = [
  RoleType.Read,
  RoleType.ViewContribute,
  RoleType.CollectionContribute,
  RoleType.LinkContribute,
  RoleType.DataDelete,
  RoleType.DataRead,
  RoleType.DataWrite,
  RoleType.DataContribute,
  RoleType.AttributeEdit,
  RoleType.Manage,
  RoleType.CommentContribute,
  RoleType.TechConfig,
  RoleType.UserConfig,
];
