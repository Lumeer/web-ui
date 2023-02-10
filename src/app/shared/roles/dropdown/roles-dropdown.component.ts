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
  ViewChild,
  ElementRef,
  EventEmitter,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Role} from '../../../core/store/permissions/permissions';
import {RoleGroup} from '../../../core/model/role-group';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {allDropdownPositions} from '../../dropdown/dropdown-position';
import {BehaviorSubject} from 'rxjs';
import {rolesAreSame} from '../../../core/store/permissions/permissions.helper';
import {deepArrayEquals} from '../../utils/array.utils';
import {ResourcePermissionType} from '../../../core/model/resource-permission-type';

@Component({
  selector: 'roles-dropdown',
  templateUrl: './roles-dropdown.component.html',
  styleUrls: ['./roles-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesDropdownComponent implements OnChanges {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public resourceType: ResourcePermissionType;

  @Input()
  public selectedRoles: Role[];

  @Input()
  public groups: RoleGroup[];

  @Input()
  public emitAllChanges: boolean;

  @Output()
  public change = new EventEmitter<Role[]>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = allDropdownPositions;

  public selectedRoles$ = new BehaviorSubject<Role[]>([]);

  public expandedGroups$ = new BehaviorSubject<number[]>([]);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedRoles && !this.isOpen()) {
      this.selectedRoles$.next(this.selectedRoles || []);
    }
  }

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public open() {
    this.dropdown?.open();
  }

  public toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  public close() {
    this.dropdown?.close();
  }

  public closeAndSave() {
    this.save();
    this.dropdown?.close();
  }

  public trackByGroup(index: number, group: RoleGroup): string {
    return group.title;
  }

  public trackByRole(index: number, role: Role): string {
    return `${role.type}:${role.transitive}`;
  }

  public toggleAllInGroup(group: RoleGroup, checked: boolean) {
    let newRoles: Role[] = this.selectedRoles$.value;
    group.roles.forEach(role => {
      if (checked) {
        newRoles = this.addRoleToArray(role, newRoles);
      } else {
        newRoles = this.removeRoleFromArray(role, newRoles);
      }
    });
    this.setRoles(newRoles);
  }

  public onClose() {
    this.save();
  }

  private save() {
    if (!deepArrayEquals(this.selectedRoles, this.selectedRoles$.value)) {
      this.change.emit(this.selectedRoles$.value);
    }
  }

  private addRoleToArray(role: Role, roles: Role[]): Role[] {
    const cleanedRoles = this.removeRoleFromArray(role, roles);
    return [...cleanedRoles, role];
  }

  private removeRoleFromArray(role: Role, roles: Role[]): Role[] {
    return [...roles].filter(r => !rolesAreSame(r, role));
  }

  public onCheckedChange(role: Role, checked: boolean) {
    let newRoles: Role[];
    if (checked) {
      newRoles = this.addRoleToArray(role, this.selectedRoles$.value);
    } else {
      newRoles = this.removeRoleFromArray(role, this.selectedRoles$.value);
    }
    this.setRoles(newRoles);
  }

  private setRoles(roles: Role[]) {
    this.selectedRoles$.next(roles);
    if (this.emitAllChanges) {
      this.change.emit(roles);
    }
  }

  public onOpenChange(opened: boolean, order: number) {
    if (opened) {
      this.expandedGroups$.next([...this.expandedGroups$.value, order]);
    } else {
      this.expandedGroups$.next(this.expandedGroups$.value.filter(o => o !== order));
    }
  }
}
