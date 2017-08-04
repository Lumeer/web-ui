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
import {ActivatedRoute, ParamMap} from '@angular/router';

import {UsersService} from '../../../core/rest/users.service';
import {RolesService} from '../../../core/rest/roles.service';
import {GroupsService} from '../../../core/rest/groups.service';
import {Entity} from '../entity';
import {Role} from '../../../core/dto/role';
import {UsersGroups} from '../../../core/dto/usersgroups';

const ROLES = {
  ['organization']: ['read', 'write', 'manage'],
  ['project']: ['read', 'write', 'manage'],
  ['collection']: ['read', 'share', 'write', 'manage'],
  ['view']: ['read', 'clone', 'manage']
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
  public entities: Entity[];
  public otherEntities: string[];

  public rolesCheckbox: {[roleName: string]: boolean};

  public constructor(private rolesService: RolesService,
                     private usersService: UsersService,
                     private groupsService: GroupsService,
                     private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.roles = ROLES[this.resourceType];
    this.rolesCheckbox = {};
    this.roles.forEach(r => {
      this.rolesCheckbox[r] = false;
    });
    switch (this.resourceType) {
      case 'organization':
        this.route.paramMap.subscribe((params: ParamMap) => {
          let orgCode: string = params.get('organizationCode');
          this.rolesService.getOrganizationRoles(orgCode)
          .subscribe((roles: Role[]) => {
            this.entities = this.getEntities(this.entityType, roles);
            this.otherEntities = this.getOtherEntities(this.entityType, orgCode, roles);
          });
        });
        break;
      case 'project':
        this.route.paramMap.subscribe((params: ParamMap) => {
          let orgCode: string = params.get('organizationCode');
          let proCode: string = params.get('projectCode');
          this.rolesService.getProjectRoles(orgCode, proCode)
          .subscribe((roles: Role[]) => {
            this.entities = this.getEntities(this.entityType, roles);
            this.otherEntities = this.getOtherEntities(this.entityType, orgCode, roles);
          });
        });
        break;
      case 'collection':
        // TODO
        break;
      case 'view':
        // TODO
        break;
    }
  }

  public updateCheckedRoles(role: string, event) {
    this.rolesCheckbox[role] = event.target.checked;
  }

  public addOrganizationUsersGroupsRole(orgCode: string, role: string, users: string[], groups: string[]) {
    this.rolesService.addOrganizationUsersGroupsRole(orgCode, role, users, groups)
      .subscribe();
  }

  public removeOrganizationUsersGroupsRole(orgCode: string, role: string, users: string[], groups: string[]) {
    this.rolesService.removeOrganizationUsersGroupsRole(orgCode, role, users, groups)
      .subscribe();
  }

  public addProjectUsersGroupsRole(orgCode: string, projectCode: string, role: string, users: string[], groups: string[]) {
    this.rolesService.addProjectUsersGroupsRole(orgCode, projectCode, role, users, groups)
      .subscribe();
  }

  public removeProjectUsersGroupsRole(orgCode: string, projectCode: string, role: string, users: string[], groups: string[]) {
    this.rolesService.removeProjectUsersGroupsRole(orgCode, projectCode, role, users, groups)
      .subscribe();
  }

  private addOrganizationRoles(addedRoles: string[], name: string) {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let orgCode: string = params.get('organizationCode');
      switch (this.entityType) {
        case 'users':
          for (let roleIdx in this.roles) {
            if (this.rolesCheckbox[this.roles[roleIdx]] && this.roles.hasOwnProperty(roleIdx)) {
              this.addOrganizationUsersGroupsRole(orgCode, this.roles[roleIdx], [name], []);
              addedRoles.push(this.roles[roleIdx]);
            }
          }
        break;
        case 'groups':
          for (let roleIdx in this.roles) {
            if (this.rolesCheckbox[this.roles[roleIdx]] && this.roles.hasOwnProperty(roleIdx)) {
              this.addOrganizationUsersGroupsRole(orgCode, this.roles[roleIdx], [], [name]);
              addedRoles.push(this.roles[roleIdx]);
            }
          }
          break;
      }
    });
  }

  private addProjectRoles(addedRoles: string[], name: string) {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let orgCode: string = params.get('organizationCode');
      let proCode: string = params.get('projectCode');
      switch (this.entityType) {
        case 'users':
          for (let roleIdx in this.roles) {
            if (this.rolesCheckbox[this.roles[roleIdx]] && this.roles.hasOwnProperty(roleIdx)) {
              this.addProjectUsersGroupsRole(orgCode, proCode, this.roles[roleIdx], [name], []);
              addedRoles.push(this.roles[roleIdx]);
            }
          }
        break;
        case 'groups':
          for (let roleIdx in this.roles) {
            if (this.rolesCheckbox[this.roles[roleIdx]] && this.roles.hasOwnProperty(roleIdx)) {
              this.addProjectUsersGroupsRole(orgCode, proCode, this.roles[roleIdx], [], [name]);
              addedRoles.push(this.roles[roleIdx]);
            }
          }
          break;
      }
    });
  }

  private addCollectionRoles(addedRoles: string[], name: string) {
    // TODO
  }

  private addViewRoles(addedRoles: string[], name: string) {
    // TODO
  }

  public onAdd(name: string) {
    let addedRoles: string[] = [];
    switch (this.resourceType) {
      case 'organization':
        this.addOrganizationRoles(addedRoles, name);
        break;
      case 'project':
        this.addProjectRoles(addedRoles, name);
        break;
      case 'collection':
        this.addCollectionRoles(addedRoles, name);
        break;
      case 'view':
        this.addViewRoles(addedRoles, name);
        break;
    }
    if (addedRoles.length !== 0) {
      this.entities.push({name: name, roles: addedRoles});
      this.otherEntities.splice(this.otherEntities.indexOf(name), 1);
      this.emptyCheckboxes();
    }
  }

  public onRemove(index: number) {
    switch (this.resourceType) {
      case 'organization':
        this.route.paramMap.subscribe((params: ParamMap) => {
          let orgCode: string = params.get('organizationCode');
          switch (this.entityType) {
            case 'users':
              this.entities[index]['roles'].forEach(role => {
                this.removeOrganizationUsersGroupsRole(orgCode, role, [this.entities[index]['name']], []);
              });
              break;
            case 'groups':
              this.entities[index]['roles'].forEach(role => {
                this.removeOrganizationUsersGroupsRole(orgCode, role, [], [this.entities[index]['name']]);
              });
              break;
          }
        });
        break;
      case 'project':
        this.route.paramMap.subscribe((params: ParamMap) => {
          let orgCode: string = params.get('organizationCode');
          let proCode: string = params.get('projectCode');
          switch (this.entityType) {
            case 'users':
              this.entities[index]['roles'].forEach(role => {
                this.removeProjectUsersGroupsRole(orgCode, proCode, role, [this.entities[index]['name']], []);
              });
              break;
            case 'groups':
              this.entities[index]['roles'].forEach(role => {
                this.removeProjectUsersGroupsRole(orgCode, proCode, role, [], [this.entities[index]['name']]);
              });
              break;
          }
        });
        break;
      case 'collection':
        // TODO
        break;
      case 'view':
        // TODO
        break;
    }
    this.otherEntities.push(this.entities[index]['name']);
    this.entities.splice(index, 1);
  }

  public changePermission(entityName: string, role: string, event) {
    let addPermision = event.target.checked;
    this.route.paramMap.subscribe((params: ParamMap) => {
      let orgCode: string = params.get('organizationCode');
      switch (this.resourceType) {
        case 'organization':
          switch (this.entityType) {
            case 'users':
              if (addPermision) {
                  this.addOrganizationUsersGroupsRole(orgCode, role, [entityName], []);
              } else {
                  this.removeOrganizationUsersGroupsRole(orgCode, role, [entityName], []);
              }
              break;
            case 'groups':
              if (addPermision) {
                  this.addOrganizationUsersGroupsRole(orgCode, role, [], [entityName]);
              } else {
                  this.removeOrganizationUsersGroupsRole(orgCode, role, [], [entityName]);
              }
          }
          break;
        case 'project':
          let proCode: string = params.get('projectCode');
          switch (this.entityType) {
            case 'users':
              if (addPermision) {
                this.route.paramMap.subscribe((params: ParamMap) => {
                  this.addProjectUsersGroupsRole(orgCode, proCode, role, [entityName], []);
                });
              } else {
                this.route.paramMap.subscribe((params: ParamMap) => {
                  this.removeProjectUsersGroupsRole(orgCode, proCode, role, [entityName], []);
                });
              }
              break;
            case 'groups':
              if (addPermision) {
                  this.addProjectUsersGroupsRole(orgCode, proCode, role, [], [entityName]);
              } else {
                  this.removeProjectUsersGroupsRole(orgCode, proCode, role, [], [entityName]);
              }
          }
          break;
        case 'collection':
          // TODO
          break;
        case 'view':
          // TODO
          break;
      }
    });
  }

  private getEntitiesForUserOrGroup(userOrGroup: string, roles: Role[]): Entity[] {
    let entitiesHolder = [];
    entitiesHolder.push({});
    roles.forEach(role => {
      role[userOrGroup].forEach(item => {
        if (entitiesHolder[0][item] == null) {
          entitiesHolder[0][item] = [role['name']];
        } else {
          entitiesHolder[0][item].push(role['name']);
        }
      });
    });
    let out = [];
    for (let key in entitiesHolder[0]) {
      if (entitiesHolder[0].hasOwnProperty(key)) {
        out.push({name: key, roles: entitiesHolder[0][key]});
      }
    }
    return out;
  }

  private getEntities(entityType: string, roles: Role[]): Entity[] {
    switch (entityType) {
      case 'users':
        return this.getEntitiesForUserOrGroup('users', roles);
      case 'groups':
        return this.getEntitiesForUserOrGroup('groups', roles);
      default:
        throw Error('unknown entity type');
    }
  }

  private getOtherEntities(entityType: string, orgCode: string, roles: Role[]): string[] {
    switch (entityType) {
      case 'users':
        let out = [];
        out.push([]);
        this.usersService.getUsersAndGroups(orgCode)
        .subscribe((usersGroups: UsersGroups) => {
          for (let userGroups in usersGroups) {
            if (usersGroups.hasOwnProperty(userGroups)) {
              out[0].push(userGroups);
            }
          }
          roles.forEach(role => {
            role['users'].forEach(user => {
              let index: number = out[0].indexOf(user, 0);
              if (index > -1) {
                out[0].splice(index, 1);
              }
            });
          });
        });
        return out[0];
      case 'groups':
        let out2 = [];
        out2.push([]);
        this.groupsService.getGroups(orgCode)
        .subscribe((groups: string[]) => {
          for (let group in groups) {
            if (groups.hasOwnProperty(group)) {
              out2[0].push(groups[group]);
            }
          }
          roles.forEach(role => {
            role['groups'].forEach(group => {
              let index: number = out2[0].indexOf(group, 0);
              if (index > -1) {
                out2[0].splice(index, 1);
              }
            });
          });
        });
        return out2[0];
      default:
        throw Error('unknown entity type');
    }
  }

  private emptyCheckboxes() {
    for (let roleCheckbox in this.rolesCheckbox) {
      if (this.rolesCheckbox.hasOwnProperty(roleCheckbox)) {
        this.rolesCheckbox[roleCheckbox] = false;
      }
    }
  }

}
