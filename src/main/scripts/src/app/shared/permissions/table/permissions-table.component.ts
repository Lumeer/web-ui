/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, Input, OnInit} from '@angular/core';

import {OrganizationService} from '../../../core/rest/organization.service';
import {ProjectService} from '../../../core/rest/project.service';
import {Permissions} from '../../../core/dto/permissions';
import {Permission} from '../../../core/dto/permission';
import {Role} from '../role';
import {EntityType} from '../entity-type';
import {ResourceType} from '../resource-type';
import {UserService} from '../../../core/rest/user.service';
import {GroupService} from '../../../core/rest/group.service';
import {Group} from '../../../core/dto/group';
import {User} from '../../../core/dto/user';
import {CollectionService} from '../../../core/rest/collection.service';
import {ViewService} from '../../../core/rest/view.service';

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

  public roles: string[];
  public entities: Permission[];
  public otherEntities: string[];

  public addedRoles: string[] = [];
  public rolesCheckbox;

  public constructor(private organizationService: OrganizationService,
                     private projectService: ProjectService,
                     private usersService: UserService,
                     private groupService: GroupService,
                     private collectionService: CollectionService,
                     private viewService: ViewService) {
  }

  public ngOnInit() {
    this.setPermissionsForResource(this.resourceType);

    this.roles = ROLES[this.resourceType];

    this.rolesCheckbox = {};
    this.roles.forEach(r => {
      this.rolesCheckbox[r] = false;
    });
  }

  private getEntities(entityType: string, permissions: Permissions): Permission[] {
    let entities = permissions[entityType];
    if (entities) {
      return entities;
    } else {
      throw Error('unknown entity type');
    }
  }

  private setPermissionsForResource(resourceType: string) {
    let parent = this;
    let getPermissionsFunctions = {
      [ResourceType.Organization]: function() {return parent.organizationService.getPermissions();} ,
      [ResourceType.Project]: function() {return parent.projectService.getPermissions();},
      [ResourceType.Collection]: function() {return parent.collectionService.getPermissions();},
      [ResourceType.View]: function() {return parent.viewService.getPermissions();},
    };
    let getPermissions = getPermissionsFunctions[resourceType];
    if (getPermissions) {
      getPermissions().subscribe((permissions: Permissions) => {
          this.entities = this.getEntities(this.entityType, permissions);
          this.getOtherEntities(this.entityType);
        });
    } else {
      throw Error('unknown resorce type');
    }
  }

  private getOtherEntities(entityType: string) {
    switch (entityType) {
      case EntityType.Users:
        this.usersService.getUsers().subscribe(
          (userEntities: User[]) => {
            this.otherEntities = this.getNotUsedEntities(userEntities, 'username');
          }
        );
        break;
      case EntityType.Groups:
        this.groupService.getGroups().subscribe(
          (groupEntities: Group[]) => {
            this.otherEntities = this.getNotUsedEntities(groupEntities, 'name');
          }
        );
        break;
      default:
        throw Error('unknown entity type');
    }
  }

  private getNotUsedEntities(entities: Object[], propertyName: string) {
    let tmpEntities = entities.map(group => group[propertyName]);
    for (let entity of this.entities) {
      let index = tmpEntities.indexOf(entity['name']);
      if (index >= 0) {
        tmpEntities.splice(index, 1);
      }
    }

    return tmpEntities;
  }

  public onAdd(selectedName: string) {
    if (this.addedRoles.length === 0 || selectedName === '') {
      return;
    }
    let parent = this;
    let resources = {
      [ResourceType.Organization]: parent.organizationService,
      [ResourceType.Project]: parent.projectService,
      [ResourceType.Collection]: parent.collectionService,
      [ResourceType.View]: parent.viewService
    };
    let resource = resources[this.resourceType];

    let updatePermissionsFunctions = {
      [EntityType.Users]: function(permission: Permission) {return resource.updateUserPermission(permission);},
      [EntityType.Groups]: function(permission: Permission) {return resource.updateGroupPermission(permission);}
    };

    let updatePermissions = updatePermissionsFunctions[this.entityType];
    if (updatePermissions) {
      let permission: Permission = {name: selectedName, roles: this.addedRoles};
      updatePermissions(permission).subscribe();
      this.entities.push(permission);
      this.otherEntities.splice(this.otherEntities.indexOf(selectedName), 1);
      this.emptyCheckboxes();
      this.addedRoles = [];
    } else {
      throw Error('unknown resource type');
    }
  }

  private emptyCheckboxes() {
    for (let k in this.rolesCheckbox) {
      if (this.rolesCheckbox.hasOwnProperty(k)) {
        this.rolesCheckbox[k] = false;
      }
    }
  }

  public updateCheckedRoles(role: string, event) {
    if (event.target.checked) {
      this.checkRoles(role, this);
    } else {
      this.addedRoles.splice(this.addedRoles.indexOf(role), 1);;
    }
  }

  private checkRoles(role: string, parent) {
    switch (role) {
      case Role.Manage:
        parent.rolesCheckbox[Role.Manage] = true;
        parent.addedRoles.push(Role.Manage);
      /* falls through */
      case Role.Write:
        parent.rolesCheckbox[Role.Write] = true;
        parent.addedRoles.push(Role.Write);
      /* falls through */
      case Role.Read:
        parent.rolesCheckbox[Role.Read] = true;
        parent.addedRoles.push(Role.Read);
        break;
      default:
        parent.rolesCheckbox[role] = true;
        this.addedRoles.push(role);
        break;
    }
  }

  public onRemove(entityName: string, index: number) {
    let parent = this;
    let resources = {
      [ResourceType.Organization]: parent.organizationService,
      [ResourceType.Project]: parent.projectService,
      [ResourceType.Collection]: parent.collectionService,
      [ResourceType.View]: parent.viewService
    };
    let resource = resources[this.resourceType];

    let removePermissionsFunctions = {
      [EntityType.Users]: function(name: string) {return resource.removeUserPermission(name);} ,
      [EntityType.Groups]: function(name: string) {return resource.removeGroupPermission(name);}
    };
    let removePermissions = removePermissionsFunctions[this.entityType];
    if (removePermissions) {
      removePermissions(entityName).subscribe();
      this.otherEntities.push(entityName);
      this.entities.splice(index, 1);
    } else {
      throw Error('unknown resource type');
    }
  }

  public changePermission(index: number, role: string, event) {
    let addPermision: boolean = event.target.checked;
    let parent = this;
    let resources = {
      [ResourceType.Organization]: parent.organizationService,
      [ResourceType.Project]: parent.projectService,
      [ResourceType.Collection]: parent.collectionService,
      [ResourceType.View]: parent.viewService
    };
    let resource = resources[this.resourceType];

    let updatePermissionsFunctions = {
      [EntityType.Users]: function(permission: Permission) {return resource.updateUserPermission(permission);} ,
      [EntityType.Groups]: function(permission: Permission) {return resource.updateGroupPermission(permission);}
    };

    let updatePermissions = updatePermissionsFunctions[this.entityType];
    if (updatePermissions) {
      if (addPermision) {
        this.entities[index]['roles'].push(role);
      } else {
        this.entities[index]['roles'].splice(this.entities[index]['roles'].indexOf(role), 1);
      }
      let permission: Permission = {name: this.entities[index]['name'], roles: this.entities[index]['roles']};
      updatePermissions(permission).subscribe();
    } else {
      throw Error('unknown resource type');
    }
  }

}
