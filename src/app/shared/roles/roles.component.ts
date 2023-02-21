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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import {RoleGroupService} from './model/role-group.service';
import {RoleGroup, TranslatedRole, translatedRolesToMap} from './model/role-group';
import {RolesDropdownComponent} from './dropdown/roles-dropdown.component';
import {ResourcePermissionType} from '../../core/model/resource-permission-type';
import {Role} from '../../core/store/permissions/permissions';
import {rolesAreSame} from '../../core/store/permissions/permissions.helper';

@Component({
  selector: 'roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RoleGroupService],
})
export class RolesComponent implements OnChanges {
  @Input()
  public resourcePermissionType: ResourcePermissionType;

  @Input()
  public roles: Record<ResourcePermissionType, Role[]>;

  @Input()
  public transitiveRoles: Record<ResourcePermissionType, Role[]>;

  @Input()
  public editable: boolean;

  @Input()
  public emitAllChanges: boolean;

  @Output()
  public change = new EventEmitter<Record<ResourcePermissionType, Role[]>>();

  @ViewChild(RolesDropdownComponent)
  public rolesDropdownComponent: RolesDropdownComponent;

  public groups: RoleGroup[];
  public selectedRoles: TranslatedRole[];
  public translatedRoles: TranslatedRole[];

  constructor(private service: RoleGroupService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourcePermissionType) {
      this.groups = this.service.createResourceGroups(this.resourcePermissionType);
    }
    if (changes.resourcePermissionType || changes.roles || changes.transitiveRoles) {
      this.translatedRoles = this.createTranslatedRoles();
      this.selectedRoles = this.translatedRoles.filter(role => !role.fromParentOrTeams);
    }
  }

  public createTranslatedRoles(): TranslatedRole[] {
    return this.groups
      .reduce((roles, group) => [...roles, ...group.roles], [])
      .reduce((roles, role) => {
        if (this.translatedRoleIsInMap(role, this.roles)) {
          return [...roles, role];
        }
        if (this.translatedRoleIsInMap(role, this.transitiveRoles)) {
          return [...roles, {...role, fromParentOrTeams: true}];
        }

        return roles;
      }, []);
  }

  private translatedRoleIsInMap(role: TranslatedRole, map: Record<ResourcePermissionType, Role[]>): boolean {
    return (map[role.permissionType] || []).some(r => rolesAreSame(r, role));
  }

  public trackByRole(index: number, role: TranslatedRole): string {
    return `${role.permissionType}:${role.type}:${role.transitive}`;
  }

  public onRolesChange(roles: TranslatedRole[]) {
    this.change.emit(translatedRolesToMap(roles));
  }

  public onClick() {
    if (this.rolesDropdownComponent?.isOpen()) {
      this.rolesDropdownComponent?.closeAndSave();
    } else {
      this.rolesDropdownComponent?.open();
    }
  }
}
