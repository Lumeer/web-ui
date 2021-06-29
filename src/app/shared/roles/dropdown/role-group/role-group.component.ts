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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {RoleGroup} from '../../../../core/model/role-group';
import {Role} from '../../../../core/store/permissions/permissions';
import {rolesAreSame} from '../../../../core/store/permissions/permissions.helper';

@Component({
  selector: 'role-group',
  templateUrl: './role-group.component.html',
  styleUrls: ['./role-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleGroupComponent implements OnChanges {
  @Input()
  public group: RoleGroup;

  @Input()
  public selectedRoles: Role[];

  @Input()
  public transitiveRoles: Role[];

  @Output()
  public checkedChange = new EventEmitter<boolean>();

  public numSelected: number;

  public onCheckedChange(checked: boolean) {
    this.checkedChange.emit(checked);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedRoles || changes.group || changes.transitiveRoles) {
      this.checkNumSelected();
    }
  }

  private checkNumSelected() {
    this.numSelected = this.group.roles.filter(
      role =>
        (this.selectedRoles || []).some(r => rolesAreSame(r, role)) ||
        (this.transitiveRoles || []).some(r => rolesAreSame(r, role))
    ).length;
  }
}
