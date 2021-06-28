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
import {RoleGroup, TranslatedRole} from '../model/role-group';
import {parseSelectTranslation} from '../../shared/utils/translation.utils';
import {RoleType} from '../model/role-type';

@Injectable()
export class RoleGroupService {
  constructor() {}

  public createResourceGroups(type: ResourceType): RoleGroup[] {
    switch (type) {
      case ResourceType.Organization:
        return this.createOrganizationGroups();
      case ResourceType.Project:
        return this.createProjectGroups();
      case ResourceType.Collection:
        return this.createCollectionGroups();
      default:
        return [];
    }
  }

  private createOrganizationGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createWorkspaceRole(RoleType.Read),
          this.createWorkspaceRole(RoleType.Manage),
          this.createWorkspaceRole(RoleType.UserConfig),
          this.createWorkspaceRole(RoleType.ProjectContribute),
        ],
      },
      {
        title: this.translateOrganizationGroupType(RoleGroupType.Data),
        order: 2,
        roles: [
          this.createWorkspaceRole(RoleType.DataRead, true),
          this.createWorkspaceRole(RoleType.DataWrite, true),
          this.createWorkspaceRole(RoleType.DataContribute, true),
          this.createWorkspaceRole(RoleType.DataDelete, true),
        ],
      },
      {
        title: this.translateOrganizationGroupType(RoleGroupType.Collaborate),
        order: 3,
        roles: [
          this.createWorkspaceRole(RoleType.CollectionContribute, true),
          this.createWorkspaceRole(RoleType.LinkContribute, true),
          this.createWorkspaceRole(RoleType.ViewContribute, true),
          this.createWorkspaceRole(RoleType.CommentContribute, true),
        ],
      },
      {
        title: this.translateOrganizationGroupType(RoleGroupType.User),
        order: 4,
        roles: [this.createWorkspaceRole(RoleType.UserConfig, true)],
      },
      {
        title: this.translateOrganizationGroupType(RoleGroupType.Config),
        order: 5,
        roles: [
          this.createWorkspaceRole(RoleType.AttributeEdit, true),
          this.createWorkspaceRole(RoleType.TechConfig, true),
        ],
      },
      {
        title: this.translateOrganizationGroupType(RoleGroupType.View),
        order: 6,
        roles: [
          this.createWorkspaceRole(RoleType.PerspectiveConfig, true),
          this.createWorkspaceRole(RoleType.QueryConfig, true),
        ],
      },
    ];
  }

  private createProjectGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createWorkspaceRole(RoleType.Read),
          this.createWorkspaceRole(RoleType.Manage),
          this.createWorkspaceRole(RoleType.UserConfig),
        ],
      },
      {
        title: this.translateProjectGroupType(RoleGroupType.Data),
        order: 2,
        roles: [
          this.createWorkspaceRole(RoleType.DataRead, true),
          this.createWorkspaceRole(RoleType.DataWrite, true),
          this.createWorkspaceRole(RoleType.DataContribute, true),
          this.createWorkspaceRole(RoleType.DataDelete, true),
        ],
      },
      {
        title: this.translateProjectGroupType(RoleGroupType.Collaborate),
        order: 3,
        roles: [
          this.createWorkspaceRole(RoleType.CollectionContribute, true),
          this.createWorkspaceRole(RoleType.LinkContribute, true),
          this.createWorkspaceRole(RoleType.ViewContribute, true),
          this.createWorkspaceRole(RoleType.CommentContribute, true),
        ],
      },
      {
        title: this.translateProjectGroupType(RoleGroupType.User),
        order: 4,
        roles: [this.createWorkspaceRole(RoleType.UserConfig, true)],
      },
      {
        title: this.translateProjectGroupType(RoleGroupType.Config),
        order: 5,
        roles: [
          this.createWorkspaceRole(RoleType.AttributeEdit, true),
          this.createWorkspaceRole(RoleType.TechConfig, true),
        ],
      },
      {
        title: this.translateProjectGroupType(RoleGroupType.View),
        order: 6,
        roles: [
          this.createWorkspaceRole(RoleType.PerspectiveConfig, true),
          this.createWorkspaceRole(RoleType.QueryConfig, true),
        ],
      },
    ];
  }

  private createCollectionGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createCollectionRole(RoleType.Read),
          this.createCollectionRole(RoleType.Manage),
          this.createCollectionRole(RoleType.UserConfig),
          this.createCollectionRole(RoleType.TechConfig),
          this.createCollectionRole(RoleType.AttributeEdit),
          this.createCollectionRole(RoleType.CommentContribute),
        ],
      },
      {
        title: this.translateCollectionGroupType(RoleGroupType.Data),
        order: 2,
        roles: [
          this.createCollectionRole(RoleType.DataRead),
          this.createCollectionRole(RoleType.DataWrite),
          this.createCollectionRole(RoleType.DataContribute),
          this.createCollectionRole(RoleType.DataDelete),
        ],
      },
    ];
  }

  private translateOrganizationGroupType(type: RoleGroupType): string {
    return parseSelectTranslation(
      $localize`:@@organization.user.permission.role.group:{type, select, Data {Manage All Data} View {Manage All Views} Collaborate {Create All} User {Manage All Permissions} Config {Manage Data Structure}}`,
      {type}
    );
  }

  private createWorkspaceRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: parseSelectTranslation(
        $localize`:@@organization.user.permission.role:{type, select, Read {Read} Manage {Manage} UserConfig {User permissions} ProjectContribute {Create projects} DataRead {Read all data} DataWrite {Edit all data} DataDelete {Delete all data} DataContribute {Create data everywhere} LinkContribute {Create link types} ViewContribute {Create views} CollectionContribute {Create tables} CommentContribute {Comment all records} AttributeEdit {Edit all attributes} TechConfig {Manage rules & functions} QueryConfig {Manage queries in views} PerspectiveConfig {Manage config in views}}`,
        {type}
      ),
      type,
      transitive,
    };
  }

  private createCollectionRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: parseSelectTranslation(
        $localize`:@@organization.user.permission.role:{type, select, Read {Read} Manage {Manage} UserConfig {User permissions} DataRead {Read records} DataWrite {Edit records} DataDelete {Delete records} DataContribute {Create records} CommentContribute {Comment records} AttributeEdit {Edit attributes} TechConfig {Manage rules & functions}}`,
        {type}
      ),
      type,
      transitive,
    };
  }

  private translateProjectGroupType(type: RoleGroupType): string {
    return parseSelectTranslation(
      $localize`:@@organization.user.permission.role.group:{type, select, Data {Manage All Data} View {Manage All Views} Collaborate {Create All} User {Manage All Permissions} Config {Manage Data Structure}}`,
      {type}
    );
  }

  private translateCollectionGroupType(type: RoleGroupType): string {
    return parseSelectTranslation(
      $localize`:@@user.permission.role.group:{type, select, Data {Manage Data} other {}}`,
      {type}
    );
  }
}

export const enum RoleGroupType {
  Data = 'Data',
  View = 'View',
  Collaborate = 'Collaborate',
  User = 'User',
  Config = 'Config',
}
