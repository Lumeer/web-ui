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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {ResourceType} from '../../../../core/model/resource-type';
import {ResourceRolesData, ResourceRolesDatum} from '../../../settings/tab/resources/list/resource-roles-data';

@Component({
  selector: 'user-projects',
  templateUrl: './user-projects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProjectsComponent {
  @Input()
  public projectsData: ResourceRolesData;

  @Input()
  public workspace: Workspace;

  @Input()
  public selectedDatum: ResourceRolesDatum;

  @Output()
  public selected = new EventEmitter<ResourceRolesDatum>();

  public readonly resourceType = ResourceType;

  public trackByDatum(index: number, datum: ResourceRolesDatum): string {
    return datum.id;
  }
}
