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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Role} from '../../../../../core/store/permissions/permissions';
import {ResourceType} from '../../../../../core/model/resource-type';

@Component({
  selector: 'user-resources-list',
  templateUrl: './user-resources-list.component.html',
  styleUrls: ['./user-resources-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserResourcesListComponent {
  @Input()
  public title: string;

  @Input()
  public emptyTitle: string;

  @Input()
  public data: ResourceRolesData[];

  @Input()
  public loaded: boolean;

  @Input()
  public resourceType: ResourceType;

  @Input()
  public selectable: boolean;

  @Input()
  public selectedId: string;

  @Output()
  public selected = new EventEmitter<string>();

  public trackByDatum(index: number, datum: ResourceRolesData): string {
    return datum.id;
  }

  public onClick(datum: ResourceRolesData) {
    if (this.selectable) {
      this.selected.emit(datum.id);
    }
  }
}

export interface ResourceRolesData {
  id: string;
  name: string;
  icons: string[];
  colors: string[];
  roles: Role[];
  transitiveRoles: Role[];
}
