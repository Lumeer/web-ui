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
import {ParamMap} from '@angular/router';

import {OrganizationService} from '../../../core/rest/organization.service';
import {ProjectService} from '../../../core/rest/project.service';
import {Permissions} from '../../../core/dto/permissions';
import {Permission} from '../../../core/dto/permission';
import {Role} from '../role';

const ROLES = {
  ['organization']: [Role.read, Role.write, Role.manage],
  ['project']: [Role.read, Role.write, Role.manage],
  ['collection']: [Role.read, Role.share, Role.write, Role.manage],
  ['view']: [Role.read, Role.clone, Role.manage]
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
    private projectService: ProjectService) {
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
      'organization': function() {return parent.organizationService.getPermissions();} ,
      'project': function() {return parent.projectService.getPermissions();},
      'collection': null, // TODO
      'view': null // TODO
    };
    let getPermissions = getPermissionsFunctions[resourceType];
    if (getPermissions) {
      getPermissions().subscribe((permissions: Permissions) => {
          this.entities = this.getEntities(this.entityType, permissions);
          this.otherEntities = this.getOtherEntities(this.entityType);
        });
    } else {
      throw Error('unknown resorce type');
    }
  }

  private getOtherEntities(entityType: string): string[] {
    switch (entityType) {
      case 'users':
        // TODO get from usersService instead
        let userEntities = ['alicak', 'kubedo', 'jkotrady', 'kulexpipiens'];
        for (let entity of this.entities) {
          let index = userEntities.indexOf(entity['name']);
          if (index >= 0) {
            userEntities.splice(index, 1);
          }
        }
        return userEntities;
      case 'groups':
        // TODO get from groupsService instead
        let groupEntities = ['directors', 'customers'];
        for (let entity of this.entities) {
          let index = groupEntities.indexOf(entity['name']);
          if (index >= 0) {
            groupEntities.splice(index, 1);
          }
        }
        return groupEntities;
      default:
        throw Error('unknown entity type');
    }
  }

  public onAdd(selectedName: string) {
    if (this.addedRoles.length === 0 || selectedName === '') {
      return;
    }
    let parent = this;
    let resources = {
      'organization': parent.organizationService,
      'project': parent.projectService,
      'collection': null, // TODO
      'view': null // TODO
    };
    let resource = resources[this.resourceType];

    let updatePermissionsFunctions = {
      'users': function(permission: Permission) {return resource.updateUserPermission(permission);} ,
      'groups': function(permission: Permission) {return resource.updateGroupPermission(permission);}
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
    this.rolesCheckbox[role] = event.target.checked;
    if (this.rolesCheckbox[role]) {
      this.addedRoles.push(role);
    } else {
      this.addedRoles.splice(this.addedRoles.indexOf(role), 1);
    }
  }

  public onRemove(entityName: string, index: number) {
    let parent = this;
    let resources = {
      'organization': parent.organizationService,
      'project': parent.projectService,
      'collection': null, // TODO
      'view': null // TODO
    };
    let resource = resources[this.resourceType];

    let removePermissionsFunctions = {
      'users': function(name: string) {return resource.removeUserPermission(name);} ,
      'groups': function(name: string) {return resource.removeGroupPermission(name);}
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
      'organization': parent.organizationService,
      'project': parent.projectService,
      'collection': null, // TODO
      'view': null // TODO
    };
    let resource = resources[this.resourceType];

    let updatePermissionsFunctions = {
      'users': function(permission: Permission) {return resource.updateUserPermission(permission);} ,
      'groups': function(permission: Permission) {return resource.updateGroupPermission(permission);}
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
