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

import {Component, Input, OnInit} from '@angular/core';
import {Group} from '../../../core/dto/group';
import {Permission} from '../../../core/dto/permission';
import {Permissions} from '../../../core/dto/permissions';
import {User} from '../../../core/dto/user';
import {CollectionService} from '../../../core/rest/collection.service';
import {GroupService} from '../../../core/rest/group.service';

import {OrganizationService} from '../../../core/rest/organization.service';
import {ProjectService} from '../../../core/rest/project.service';
import {UserService} from '../../../core/rest/user.service';
import {ViewService} from '../../../core/rest/view.service';
import {EntityType} from '../entity-type';
import {ResourceType} from '../resource-type';
import {Role} from '../role';
import {OrganizationModel} from "../../../core/store/organizations/organization.model";
import {Subscription} from "rxjs/Subscription";
import {filter} from "rxjs/operators";
import {isNullOrUndefined} from "util";
import {selectOrganizationByWorkspace} from "../../../core/store/organizations/organizations.state";
import {AppState} from "../../../core/store/app.state";
import {Store} from "@ngrx/store";

const ROLES = {
  [ResourceType.Organization]: [Role.Read, Role.Write, Role.Manage],
  [ResourceType.Project]: [Role.Read, Role.Write, Role.Manage],
  [ResourceType.Collection]: [Role.Read, Role.Share, Role.Write, Role.Manage],
  [ResourceType.View]: [Role.Read, Role.Clone, Role.Manage]
};

@Component({
  selector: 'permissions-table',
  templateUrl: './permissions-table.component.html',
  styleUrls: ['./permissions-table.component.scss']
})
export class PermissionsTableComponent implements OnInit {

  @Input()
  public resourceType: string;

  @Input()
  public entityType: string;

  public roles: string[] = [];
  public entities: Permission[] = [];
  public possibleEntities: string[] = [];

  public addedRoles: string[] = [];
  public rolesCheckbox: { [role: string]: boolean };

  private organization: OrganizationModel;
  private organizationSubscription: Subscription;

  public constructor(private organizationService: OrganizationService,
                     private projectService: ProjectService,
                     private usersService: UserService,
                     private groupService: GroupService,
                     private collectionService: CollectionService,
                     private viewService: ViewService,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeData();

    this.roles = ROLES[this.resourceType];

    this.rolesCheckbox = {};
    this.roles.forEach(role => this.rolesCheckbox[role] = false);
  }

  public allEntities(): string[] {
    return this.entities
      .map(entity => entity.name)
      .concat(this.possibleEntities);
  }

  private getEntities(entityType: string, permissions: Permissions): Permission[] {
    const entities = permissions[entityType];

    if (!entities) {
      throw Error('unknown entity type');
    }

    return entities;
  }

  private setPermissionsForResource(resourceType: string) {
    const getPermissionsFunctions = {
      [ResourceType.Organization]: () => this.organizationService.getPermissions(),
      [ResourceType.Project]: () => this.projectService.getPermissions(),
      [ResourceType.Collection]: () => this.collectionService.getPermissions(),
      [ResourceType.View]: () => this.viewService.getPermissions(),
    };

    const getPermissions = getPermissionsFunctions[resourceType];
    if (!getPermissions) {
      throw Error('unknown resource type');
    }

    getPermissions().subscribe((permissions: Permissions) => {
      this.entities = this.getEntities(this.entityType, permissions);
      this.getOtherEntities(this.entityType);
    });
  }

  private getOtherEntities(entityType: string) {
    switch (entityType) {
      case EntityType.Users:
        this.usersService.getUsers(this.organization.id).subscribe(
          (userEntities: User[]) => {
            this.possibleEntities = this.getNotUsedEntities(userEntities, 'username');
          }
        );
        break;

      case EntityType.Groups:
        this.groupService.getGroups().subscribe(
          (groupEntities: Group[]) => {
            this.possibleEntities = this.getNotUsedEntities(groupEntities, 'name');
          }
        );
        break;

      default:
        throw Error('unknown entity type');
    }
  }

  private getNotUsedEntities(entities: Object[], propertyName: string) {
    const tmpEntities = entities.map(group => group[propertyName]);
    for (const entity of this.entities) {
      const index = tmpEntities.indexOf(entity.name);
      if (index !== -1) {
        tmpEntities.splice(index, 1);
      }
    }

    return tmpEntities;
  }

  public onAdd(selectedName: string) {
    if (!this.addedRoles.length || !selectedName) {
      return;
    }

    const resources = {
      [ResourceType.Organization]: this.organizationService,
      [ResourceType.Project]: this.projectService,
      [ResourceType.Collection]: this.collectionService,
      [ResourceType.View]: this.viewService
    };

    const resource = resources[this.resourceType];

    const updatePermissionsFunctions = {
      [EntityType.Users]: (permission: Permission) => resource.updateUserPermission(permission),
      [EntityType.Groups]: (permission: Permission) => resource.updateGroupPermission(permission)
    };

    const updatePermissions = updatePermissionsFunctions[this.entityType];

    if (!updatePermissions) {
      throw Error('unknown resource type');
    }

    const permission: Permission = {name: selectedName, roles: this.addedRoles};
    updatePermissions(permission).subscribe();
    this.entities.push(permission);
    this.possibleEntities.splice(this.possibleEntities.indexOf(selectedName), 1);
    this.emptyCheckboxes();
    this.addedRoles = [];
  }

  private emptyCheckboxes() {
    Object.keys(this.rolesCheckbox).forEach(role => this.rolesCheckbox[role] = false);
  }

  public updateCheckedRoles(role: string, event) {
    if (event.target.checked) {
      this.checkRoles(role);
    } else {
      this.addedRoles.splice(this.addedRoles.indexOf(role), 1);
    }
  }

  private checkRoles(role: string) {
    switch (role) {
      case Role.Manage:
        this.rolesCheckbox[Role.Manage] = true;
        this.addedRoles.push(Role.Manage);
      /* falls through */
      case Role.Write:
        this.rolesCheckbox[Role.Write] = true;
        this.addedRoles.push(Role.Write);
      /* falls through */
      case Role.Read:
        this.rolesCheckbox[Role.Read] = true;
        this.addedRoles.push(Role.Read);
        break;
      default:
        this.rolesCheckbox[role] = true;
        this.addedRoles.push(role);
        break;
    }
  }

  public onRemove(entityName: string, index: number) {
    const resources = {
      [ResourceType.Organization]: this.organizationService,
      [ResourceType.Project]: this.projectService,
      [ResourceType.Collection]: this.collectionService,
      [ResourceType.View]: this.viewService
    };
    const resource = resources[this.resourceType];

    const removePermissionsFunctions = {
      [EntityType.Users]: (name: string) => resource.removeUserPermission(name),
      [EntityType.Groups]: (name: string) => resource.removeGroupPermission(name)
    };

    const removePermissions = removePermissionsFunctions[this.entityType];

    if (!removePermissions) {
      throw Error('unknown resource type');
    }

    removePermissions(entityName).subscribe();
    this.possibleEntities.push(entityName);
    this.entities.splice(index, 1);
  }

  public changePermission(index: number, role: string, event) {
    const addPermision: boolean = event.target.checked;

    const resources = {
      [ResourceType.Organization]: this.organizationService,
      [ResourceType.Project]: this.projectService,
      [ResourceType.Collection]: this.collectionService,
      [ResourceType.View]: this.viewService
    };

    const resource = resources[this.resourceType];

    const updatePermissionsFunctions = {
      [EntityType.Users]: (permission: Permission) => resource.updateUserPermission(permission),
      [EntityType.Groups]: (permission: Permission) => resource.updateGroupPermission(permission)
    };

    const updatePermissions = updatePermissionsFunctions[this.entityType];

    if (!updatePermissions) {
      throw Error('unknown resource type');
    }

    const entity = this.entities[index];
    if (addPermision) {
      entity.roles.push(role);
    } else {
      entity.roles.splice(entity.roles.indexOf(role), 1);
    }

    const permission: Permission = {name: entity.name, roles: this.entities[index].roles};
    updatePermissions(permission).subscribe();
  }

  private subscribeData() {
    this.organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => {
        if (isNullOrUndefined(this.organization) || this.organization.id != organization.id) {
          this.setPermissionsForResource(this.resourceType);
        }
        this.organization = organization
      });

  }
}
