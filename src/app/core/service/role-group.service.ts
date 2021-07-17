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
      case ResourceType.View:
        return this.createViewGroups();
      default:
        return [];
    }
  }

  private createOrganizationGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createOrganizationRole(RoleType.Read),
          this.createOrganizationRole(RoleType.Manage),
          this.createOrganizationRole(RoleType.ProjectContribute),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.User),
        order: 2,
        roles: [
          this.createOrganizationRole(RoleType.UserConfig),
          this.createOrganizationRole(RoleType.UserConfig, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Collaborate),
        order: 3,
        roles: [
          this.createOrganizationRole(RoleType.CollectionContribute, true),
          this.createOrganizationRole(RoleType.LinkContribute, true),
          this.createOrganizationRole(RoleType.ViewContribute, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Config),
        order: 4,
        roles: [
          this.createOrganizationRole(RoleType.Read, true),
          this.createOrganizationRole(RoleType.Manage, true),
          this.createOrganizationRole(RoleType.AttributeEdit, true),
          this.createOrganizationRole(RoleType.TechConfig, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Data),
        order: 5,
        roles: [
          this.createOrganizationRole(RoleType.DataRead, true),
          this.createOrganizationRole(RoleType.DataWrite, true),
          this.createOrganizationRole(RoleType.DataContribute, true),
          this.createOrganizationRole(RoleType.DataDelete, true),
          this.createOrganizationRole(RoleType.CommentContribute, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.View),
        order: 6,
        roles: [
          this.createOrganizationRole(RoleType.PerspectiveConfig, true),
          this.createOrganizationRole(RoleType.QueryConfig, true),
        ],
      },
    ];
  }

  private createProjectGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createProjectRole(RoleType.Read),
          this.createProjectRole(RoleType.Manage),
          this.createProjectRole(RoleType.TechConfig),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.User),
        order: 2,
        roles: [this.createProjectRole(RoleType.UserConfig), this.createProjectRole(RoleType.UserConfig, true)],
      },
      {
        title: this.translateGroupType(RoleGroupType.Collaborate),
        order: 3,
        roles: [
          this.createProjectRole(RoleType.CollectionContribute, true),
          this.createProjectRole(RoleType.LinkContribute, true),
          this.createProjectRole(RoleType.ViewContribute, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Config),
        order: 4,
        roles: [
          this.createProjectRole(RoleType.Read, true),
          this.createProjectRole(RoleType.Manage, true),
          this.createProjectRole(RoleType.AttributeEdit, true),
          this.createProjectRole(RoleType.TechConfig, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Data),
        order: 5,
        roles: [
          this.createProjectRole(RoleType.DataRead, true),
          this.createProjectRole(RoleType.DataWrite, true),
          this.createProjectRole(RoleType.DataContribute, true),
          this.createProjectRole(RoleType.DataDelete, true),
          this.createProjectRole(RoleType.CommentContribute, true),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.View),
        order: 6,
        roles: [
          this.createProjectRole(RoleType.PerspectiveConfig, true),
          this.createProjectRole(RoleType.QueryConfig, true),
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
        title: this.translateGroupType(RoleGroupType.Data),
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

  private createViewGroups(): RoleGroup[] {
    return [
      {
        order: 1,
        roles: [
          this.createViewRole(RoleType.Read),
          this.createViewRole(RoleType.Manage),
          this.createViewRole(RoleType.UserConfig),
          this.createViewRole(RoleType.PerspectiveConfig),
          this.createViewRole(RoleType.QueryConfig),
        ],
      },
      {
        title: this.translateGroupType(RoleGroupType.Data),
        order: 2,
        roles: [
          this.createViewRole(RoleType.DataRead),
          this.createViewRole(RoleType.DataWrite),
          this.createViewRole(RoleType.DataContribute),
          this.createViewRole(RoleType.DataDelete),
        ],
      },
    ];
  }

  private createOrganizationRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: transitive
        ? this.workspaceTransitiveRoleTitle(type, ResourceType.Organization)
        : this.organizationRoleTitle(type),
      tooltip: this.organizationRoleTooltip(type, transitive),
      type,
      transitive,
    };
  }

  private createProjectRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: transitive ? this.workspaceTransitiveRoleTitle(type, ResourceType.Project) : this.projectRoleTitle(type),
      tooltip: this.projectRoleTooltip(type, transitive),
      type,
      transitive,
    };
  }

  private organizationRoleTitle(type: RoleType): string {
    return parseSelectTranslation(
      $localize`:@@organization.permission.role.title:{type, select, Read {Join} Manage {Manage} UserConfig {Manage Organization Users} ProjectContribute {Create Projects}}`,
      {type}
    );
  }

  private organizationRoleTooltip(type: RoleType, transitive: boolean): string {
    switch (type) {
      case RoleType.Read:
        if (transitive) {
          return $localize`:@@organization.permission.transitive.role.tooltip.Read:A user can see all projects, tables, views and links in all projects in this organization.`;
        }
        return $localize`:@@organization.permission.role.tooltip.Read:A user joins this organization and can see it.`;
      case RoleType.Manage:
        if (transitive) {
          return $localize`:@@organization.permission.transitive.role.tooltip.Manage:A user can change and delete all projects, tables, views and links in all projects in this organization.`;
        }
        return $localize`:@@organization.permission.role.tooltip.Manage:A user can change the organization name, color, icon, description, can trigger payments and update invoicing contact, can delete the organization.`;
      case RoleType.ProjectContribute:
        return $localize`:@@organization.permission.role.tooltip.ProjectContribute:A user can create new projects in this organization. They become a manager of the new project.`;
      case RoleType.UserConfig:
        if (transitive) {
          return $localize`:@@organization.permission.transitive.role.tooltip.UserConfig:A user can add, modify, and delete users and their rights everywhere in this organization.`;
        }
        return $localize`:@@organization.permission.role.tooltip.UserConfig:A user can add, modify, and delete users in this organization (at the organizational level).`;
      case RoleType.DataRead:
        return $localize`:@@organization.permission.transitive.role.tooltip.DataRead:A user can read all data in all tables and views in all projects in this organization.`;
      case RoleType.DataWrite:
        return $localize`:@@organization.permission.transitive.role.tooltip.DataWrite:A user can modify all data in all tables and views in all projects in this organization.`;
      case RoleType.DataDelete:
        return $localize`:@@organization.permission.transitive.role.tooltip.DataDelete:A user can delete all records (rows) in all tables and views in all projects in this organization.`;
      case RoleType.DataContribute:
        return $localize`:@@organization.permission.transitive.role.tooltip.DataContribute:A user can create, see, modify and delete only their own records (rows) in all tables, links, and views in all projects in this organization.`;
      case RoleType.CommentContribute:
        return $localize`:@@organization.permission.transitive.role.tooltip.CommentContribute:A user can comment all records in all projects in this organization.`;
      case RoleType.CollectionContribute:
        return $localize`:@@organization.permission.transitive.role.tooltip.CollectionContribute:A user can create tables in all projects in this organization. They become a manager of the new table.`;
      case RoleType.ViewContribute:
        return $localize`:@@organization.permission.transitive.role.tooltip.ViewContribute:A user can create views in all projects in this organization. They become a manager of the new view.`;
      case RoleType.LinkContribute:
        return $localize`:@@organization.permission.transitive.role.tooltip.LinkContribute:A user can create link types in all projects in this organization. They become a manager of the new link type.`;
      case RoleType.AttributeEdit:
        return $localize`:@@organization.permission.transitive.role.tooltip.AttributeEdit:A user can add, modify, and delete columns in tables and link types in all projects in this organization.`;
      case RoleType.TechConfig:
        return $localize`:@@organization.permission.transitive.role.tooltip.TechConfig:A user can add, modify, and delete automations in all tables and link types in all projects in this organization.`;
      case RoleType.PerspectiveConfig:
        return $localize`:@@organization.permission.transitive.role.tooltip.PerspectiveConfig:A user can manage visual view configurations of all views in all projects in this organization.`;
      case RoleType.QueryConfig:
        return $localize`:@@organization.permission.transitive.role.tooltip.QueryConfig:A user can modify queries in all views in all projects in this organization.`;
    }
  }

  private projectRoleTitle(type: RoleType): string {
    return parseSelectTranslation(
      $localize`:@@project.permission.role.title:{type, select, Read {Join} Manage {Manage} UserConfig {Manage Project Users} TechConfig {Manage Sequences}}`,
      {type}
    );
  }

  private workspaceTransitiveRoleTitle(type: RoleType, resourceType: ResourceType): string {
    switch (resourceType) {
      case ResourceType.Organization:
      default:
        return parseSelectTranslation(
          $localize`:@@organization.permission.transitive.role.organization.title:{type, select, Read {Join All Projects, Tables, Links and Views} Manage {Manage All Tables, Links and Views} UserConfig {Manage All Users} DataRead {Read Everything} DataWrite {Write Everywhere} DataDelete {Delete Everywhere} DataContribute {Contribute Everywhere} LinkContribute {Create Link Types Everywhere} ViewContribute {Create Views Everywhere} CollectionContribute {Create Tables Everywhere} CommentContribute {Comment on Anything} AttributeEdit {Manage Table Columns} TechConfig {Manage Automations} QueryConfig {Manage View Queries Everywhere} PerspectiveConfig {Configure Views Everywhere}}`,
          {type}
        );
      case ResourceType.Project:
        return parseSelectTranslation(
          $localize`:@@organization.permission.transitive.role.project.title:{type, select, Read {Join All Tables, Links and Views} Manage {Manage All Tables, Links and Views} UserConfig {Manage All Users} DataRead {Read Everything} DataWrite {Write Everywhere} DataDelete {Delete Everywhere} DataContribute {Contribute Everywhere} LinkContribute {Create Link Types Everywhere} ViewContribute {Create Views Everywhere} CollectionContribute {Create Tables Everywhere} CommentContribute {Comment on Anything} AttributeEdit {Manage Table Columns} TechConfig {Manage Automations} QueryConfig {Manage View Queries Everywhere} PerspectiveConfig {Configure Views Everywhere}}`,
          {type}
        );
    }
  }

  private projectRoleTooltip(type: RoleType, transitive: boolean): string {
    switch (type) {
      case RoleType.Read:
        if (transitive) {
          return $localize`:@@project.permission.transitive.role.tooltip.Read:A user can see all tables, views and links in this project. However for their content (data) there is a separate right.`;
        }
        return $localize`:@@project.permission.role.tooltip.Read:A user joins this project and can see it.`;
      case RoleType.Manage:
        if (transitive) {
          return $localize`:@@project.permission.transitive.role.tooltip.Manage:A user can change and delete all tables, views and links in this project.`;
        }
        return $localize`:@@project.permission.role.tooltip.Manage:A user can change the project name, color, icon, description and can delete it.`;
      case RoleType.UserConfig:
        if (transitive) {
          return $localize`:@@project.permission.transitive.role.tooltip.UserConfig:A user can manage user rights everywhere in the project.`;
        }
        return $localize`:@@project.permission.role.tooltip.UserConfig:A user can manage user rights in this project (at the project level).`;
      case RoleType.TechConfig:
        if (transitive) {
          return $localize`:@@project.permission.transitive.role.tooltip.TechConfig:A user can add, modify, and delete automations on all tables and link types in this project.`;
        }
        return $localize`:@@project.permission.role.tooltip.TechConfig:A user can manage sequences and publish project.`;
      case RoleType.DataRead:
        return $localize`:@@project.permission.transitive.role.tooltip.DataRead:A user can read all data in all tables and views in this project.`;
      case RoleType.DataWrite:
        return $localize`:@@project.permission.transitive.role.tooltip.DataWrite:A user can modify all data in all tables and views in this project.`;
      case RoleType.DataDelete:
        return $localize`:@@project.permission.transitive.role.tooltip.DataDelete:A user can delete all records (rows) in all tables and views in this project.`;
      case RoleType.DataContribute:
        return $localize`:@@project.permission.transitive.role.tooltip.DataContribute:A user can create, see, modify and delete only their own records (rows) in all tables, links, and views in this project.`;
      case RoleType.CommentContribute:
        return $localize`:@@project.permission.transitive.role.tooltip.CommentContribute:A user can comment all records in this project.`;
      case RoleType.CollectionContribute:
        return $localize`:@@project.permission.transitive.role.tooltip.CollectionContribute:A user can create tables in this project. They become a manager of the new table.`;
      case RoleType.ViewContribute:
        return $localize`:@@project.permission.transitive.role.tooltip.ViewContribute:A user can create views in this project. They become a manager of the new view.`;
      case RoleType.LinkContribute:
        return $localize`:@@project.permission.transitive.role.tooltip.LinkContribute:A user can create link types in this project. They become a manager of the new link type.`;
      case RoleType.AttributeEdit:
        return $localize`:@@project.permission.transitive.role.tooltip.AttributeEdit:A user can add, modify, and delete columns in all tables and link types in this project.`;
      case RoleType.PerspectiveConfig:
        return $localize`:@@project.permission.transitive.role.tooltip.PerspectiveConfig:A user can manage visual view configurations of all views in this project.`;
      case RoleType.QueryConfig:
        return $localize`:@@project.permission.transitive.role.tooltip.QueryConfig:A user can modify queries in all views in this project.`;
    }
  }

  private createCollectionRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: this.collectionRoleTitle(type),
      tooltip: this.collectionRoleTooltip(type),
      type,
      transitive,
    };
  }

  private collectionRoleTitle(type: RoleType): string {
    return parseSelectTranslation(
      $localize`:@@collection.permission.role.title:{type, select, Read {Join} Manage {Manage} UserConfig {Manage Users} DataRead {Read Records} DataWrite {Edit Records} DataDelete {Delete Records} DataContribute {Contribute Records} CommentContribute {Comment Records} AttributeEdit {Manage Columns} TechConfig {Manage Automations}}`,
      {type}
    );
  }

  private collectionRoleTooltip(type: RoleType): string {
    switch (type) {
      case RoleType.Read:
        return $localize`:@@collection.permission.role.tooltip.Read:A user joins this table and can see it. Users need other rights to be able to see and work with the table content.`;
      case RoleType.Manage:
        return $localize`:@@collection.permission.role.tooltip.Manage:A user can change the table name, color, icon, description and can delete it.`;
      case RoleType.UserConfig:
        return $localize`:@@collection.permission.role.tooltip.UserConfig:A user can manage user rights in this table.`;
      case RoleType.DataRead:
        return $localize`:@@collection.permission.role.tooltip.DataRead:A user can read all data in this table.`;
      case RoleType.DataWrite:
        return $localize`:@@collection.permission.role.tooltip.DataWrite:A user can modify all data in this table.`;
      case RoleType.DataDelete:
        return $localize`:@@collection.permission.role.tooltip.DataDelete:A user can delete all records (rows) in this table.`;
      case RoleType.DataContribute:
        return $localize`:@@collection.permission.role.tooltip.DataContribute:A user can create, see, modify and delete only their own records (rows) in this table.`;
      case RoleType.CommentContribute:
        return $localize`:@@collection.permission.role.tooltip.CommentContribute:A user can comment all records in this table.`;
      case RoleType.AttributeEdit:
        return $localize`:@@collection.permission.role.tooltip.AttributeEdit:A user can add, modify, and delete columns in this table.`;
      case RoleType.TechConfig:
        return $localize`:@@collection.permission.role.tooltip.TechConfig:A user can add, modify, and delete automations in this table.`;
    }
  }

  private createViewRole(type: RoleType, transitive?: boolean): TranslatedRole {
    return {
      title: this.viewRoleTitle(type),
      tooltip: this.viewRoleTooltip(type),
      type,
      transitive,
    };
  }

  private viewRoleTitle(type: RoleType): string {
    return parseSelectTranslation(
      $localize`:@@view.permission.role.title:{type, select, Read {Join} Manage {Manage Settings} UserConfig {Manage Users} DataRead {Read Records} DataWrite {Edit Records} DataDelete {Delete Records} DataContribute {Create Records} CommentContribute {Comment Records} PerspectiveConfig {Configure View} QueryConfig {Manage Query}}`,
      {type}
    );
  }

  private viewRoleTooltip(type: RoleType): string {
    switch (type) {
      case RoleType.Read:
        return $localize`:@@view.permission.role.tooltip.Read:A user joins this view and can see it. Users need other rights to be able to open the view, see and work with the view content.`;
      case RoleType.Manage:
        return $localize`:@@view.permission.role.tooltip.Manage:A user can change the view name, color, icon, folders and can delete it.`;
      case RoleType.UserConfig:
        return $localize`:@@view.permission.role.tooltip.UserConfig:A user can manage user rights in this view.`;
      case RoleType.DataRead:
        return $localize`:@@view.permission.role.tooltip.DataRead:A user can read all data in this view.`;
      case RoleType.DataWrite:
        return $localize`:@@view.permission.role.tooltip.DataWrite:A user can modify all data in this view.`;
      case RoleType.DataDelete:
        return $localize`:@@view.permission.role.tooltip.DataDelete:A user can delete all records (rows) in this view.`;
      case RoleType.DataContribute:
        return $localize`:@@view.permission.role.tooltip.DataContribute:A user can create, see, modify and delete only their own records (rows) in this view.`;
      case RoleType.CommentContribute:
        return $localize`:@@view.permission.role.tooltip.CommentContribute:A user can comment all records in this view.`;
      case RoleType.PerspectiveConfig:
        return $localize`:@@view.permission.role.tooltip.PerspectiveConfig:A user can manage the visual configuration of this view.`;
      case RoleType.QueryConfig:
        return $localize`:@@view.permission.role.tooltip.QueryConfig:A user can modify queries in this view.`;
    }
  }

  private translateGroupType(type: RoleGroupType): string {
    return parseSelectTranslation(
      $localize`:@@organization.permission.role.group:{type, select, Data {Manage Data} View {Manage Views} Collaborate {Create Tables, Links and Views} User {User Management} Config {Manage Tables, Links and Views}}`,
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
