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

export const enum RoleType {
  Read = 'Read',
  Manage = 'Manage',
  DataRead = 'DataRead',
  DataWrite = 'DataWrite',
  DataDelete = 'DataDelete',
  DataContribute = 'DataContribute',
  ViewContribute = 'ViewContribute',
  CollectionContribute = 'CollectionContribute',
  LinkContribute = 'LinkContribute',
  ProjectContribute = 'ProjectContribute',
  CommentContribute = 'CommentContribute',
  AttributeEdit = 'AttributeEdit',
  UserConfig = 'UserConfig',
  TechConfig = 'TechConfig',
  PerspectiveConfig = 'PerspectiveConfig',
  QueryConfig = 'QueryConfig',
}

export const roleTypesMap = {
  [RoleType.Read]: RoleType.Read,
  [RoleType.Manage]: RoleType.Manage,
  [RoleType.DataRead]: RoleType.DataRead,
  [RoleType.DataWrite]: RoleType.DataWrite,
  [RoleType.DataDelete]: RoleType.DataDelete,
  [RoleType.DataContribute]: RoleType.DataContribute,
  [RoleType.ViewContribute]: RoleType.ViewContribute,
  [RoleType.CollectionContribute]: RoleType.CollectionContribute,
  [RoleType.LinkContribute]: RoleType.LinkContribute,
  [RoleType.ProjectContribute]: RoleType.ProjectContribute,
  [RoleType.CommentContribute]: RoleType.CommentContribute,
  [RoleType.AttributeEdit]: RoleType.AttributeEdit,
  [RoleType.UserConfig]: RoleType.UserConfig,
  [RoleType.TechConfig]: RoleType.TechConfig,
  [RoleType.PerspectiveConfig]: RoleType.PerspectiveConfig,
  [RoleType.QueryConfig]: RoleType.QueryConfig,
};
