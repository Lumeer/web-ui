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

import {RolesService} from '../../../core/rest/roles.service';
import {Entity} from '../entity';

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

  public constructor(private rolesService: RolesService) {
  }

  public ngOnInit() {
    this.roles = ROLES[this.resourceType];
    this.entities = this.getEntities(this.entityType);
    this.otherEntities = this.getOtherEntities(this.entityType);
  }

  private getEntities(entityType: string): Entity[] {
    switch (entityType) {
      case 'users':
        // TODO get from rolesService instead
        return [
          {name: 'marvec', roles: ['read', 'share', 'write', 'manage']},
          {name: 'livthomas', roles: ['read', 'share', 'write']}
        ];
      case 'groups':
        // TODO get from rolesService instead
        return [
          {name: 'managers', roles: ['read', 'share', 'write', 'manage']},
          {name: 'employees', roles: ['read', 'share']},
          {name: 'contractors', roles: ['read']}
        ];
      default:
        throw Error('unknown entity type');
    }
  }

  private getOtherEntities(entityType: string): string[] {
    switch (entityType) {
      case 'users':
        // TODO get from usersService instead
        return ['alicak', 'kubedo', 'jkotrady', 'kulexpipiens'];
      case 'groups':
        // TODO get from groupsService instead
        return ['directors', 'customers'];
      default:
        throw Error('unknown entity type');
    }
  }

  public onAdd() {
    // TODO call remote service
  }

  public onRemove(entity: string) {
    // TODO call remote service
  }

}
