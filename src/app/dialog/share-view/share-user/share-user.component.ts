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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {ResourceType} from '../../../core/model/resource-type';

@Component({
  selector: '[share-user]',
  templateUrl: './share-user.component.html',
  styleUrls: ['./share-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareUserComponent {
  @Input()
  public canRemove: boolean;

  @Input()
  public changeRoles: boolean;

  @Input()
  public email: string;

  @Input()
  public roles: string[];

  @Output()
  public delete = new EventEmitter();

  @Output()
  public rolesChange = new EventEmitter<string[]>();

  public viewResourceType = ResourceType.View;

  public toggleRole(role: string) {
    if (!this.changeRoles) {
      return;
    }

    const newRoles = this.roles.includes(role) ? this.roles.filter(r => r !== role) : [...this.roles, role];
    this.rolesChange.emit(newRoles);
  }

  public onDelete() {
    this.delete.emit();
  }
}
