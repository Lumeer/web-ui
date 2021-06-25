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

import {Injectable} from '@angular/core';
import {ResourceType} from '../model/resource-type';
import {RoleGroup} from '../model/role-group';
import {parseSelectTranslation} from '../../shared/utils/translation.utils';
import {RoleType} from '../model/role-type';

@Injectable()
export class RoleGroupService {

  constructor() {
  }

  public createResourceGroups(type: ResourceType): RoleGroup[] {
    switch (type) {
      case ResourceType.Organization:
        return this.createOrganizationGroups();
      default:
        return [];
    }
  }

  private createOrganizationGroups(): RoleGroup[] {
    return [
      {title: this.translateGroupType(RoleGroupType.Resource), order: 1, roles: [{type: RoleType.Read}, {type: RoleType.Manage}, {type: RoleType.UserConfig}, {type: RoleType.ProjectContribute}]},
      {title: this.translateGroupType(RoleGroupType.Data), order: 2, roles: [{type: RoleType.DataRead, transitive: true}, {type: RoleType.DataWrite, transitive: true}, {type: RoleType.DataContribute, transitive: true}, {type: RoleType.DataDelete, transitive: true}]},
      {title: this.translateGroupType(RoleGroupType.Collaborate), order: 3, roles: [{type: RoleType.CollectionContribute, transitive: true}, {type: RoleType.LinkContribute, transitive: true}, {type: RoleType.ViewContribute, transitive: true}, {type: RoleType.CommentContribute, transitive: true}]},
      {title: this.translateGroupType(RoleGroupType.User), order: 4, roles: [{type: RoleType.UserConfig, transitive: true}]},
      {title: this.translateGroupType(RoleGroupType.Config), order: 5, roles: [{type: RoleType.AttributeEdit, transitive: true}, {type: RoleType.TechConfig, transitive: true}]},
      {title: this.translateGroupType(RoleGroupType.View), order: 6, roles: [{type: RoleType.PerspectiveConfig, transitive: true}, {type: RoleType.QueryConfig, transitive: true}]},
    ]
  }

  private translateGroupType(type: RoleGroupType): string {
    return parseSelectTranslation(
      $localize`:@@user.permission.role.group:{type, select, Resource {Resource} Data {Data} View {View} Collaborate {Collaborate} User {User} Config {Config}}`,
      {type}
    )
  }


}


export const enum RoleGroupType {
  Resource = 'Resource',
  Data = 'Data',
  View = 'View',
  Collaborate = 'Collaborate',
  User = 'User',
  Config = 'Config',
}



