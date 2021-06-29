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
  HostListener,
} from '@angular/core';
import {Role} from '../../core/store/permissions/permissions';
import {ResourceType} from '../../core/model/resource-type';
import {RoleGroupService} from '../../core/service/role-group.service';
import {RoleGroup, TranslatedRole} from '../../core/model/role-group';
import {RolesDropdownComponent} from './dropdown/roles-dropdown.component';
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
  public resourceType: ResourceType;

  @Input()
  public roles: Role[];

  @Input()
  public transitiveRoles: Role[];

  @Input()
  public editable: boolean;

  @Output()
  public change = new EventEmitter<Role[]>();

  @ViewChild(RolesDropdownComponent)
  public rolesDropdownComponent: RolesDropdownComponent;

  public groups: RoleGroup[];
  public transitiveTranslatedRoles: TranslatedRole[];
  public translatedRoles: TranslatedRole[];

  constructor(private service: RoleGroupService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType) {
      this.groups = this.service.createResourceGroups(this.resourceType);
    }
    if (changes.roles) {
      this.translatedRoles = this.createTranslatedRoles(this.roles);
    }
    if (changes.transitiveRoles) {
      this.transitiveTranslatedRoles = this.createTranslatedRoles(this.transitiveRoles).filter(
        role => !this.translatedRoles.some(r => rolesAreSame(r, role))
      );
    }
  }

  public createTranslatedRoles(roles: Role[]): TranslatedRole[] {
    return this.groups
      .reduce((roles, group) => [...roles, ...group.roles], [])
      .filter(role => roles.some(r => rolesAreSame(r, role)));
  }

  public trackByRole(index: number, role: Role): string {
    return `${role.type}:${role.transitive}`;
  }

  public onRolesChange(roles: Role[]) {
    this.change.emit(roles);
  }

  @HostListener('click')
  public onClick() {
    this.rolesDropdownComponent?.toggle();
  }
}
