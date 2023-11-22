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

import {ResourceType} from '../../../../../core/model/resource-type';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';

@Component({
  selector: 'resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent {
  @Input()
  public currentId: string;

  @Input()
  public organizations: Organization[];

  @Input()
  public projects: Project[];

  @Input()
  public type: ResourceType;

  @Output()
  public onResourceSelect = new EventEmitter<Project | Organization>();

  public readonly resourceType = ResourceType;

  public selectResource(model: Project | Organization) {
    this.onResourceSelect.emit(model);
  }
}
