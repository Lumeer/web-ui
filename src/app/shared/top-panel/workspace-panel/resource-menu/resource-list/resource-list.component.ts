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
import {OrganizationModel} from '../../../../../core/store/organizations/organization.model';
import {ProjectModel} from '../../../../../core/store/projects/project.model';
import {Resource} from '../../../../../core/dto';

@Component({
  selector: 'resource-list',
  templateUrl: './resource-list.component.html',
  styleUrls: ['./resource-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceListComponent {
  @Input() public currentCode: string;
  @Input() public organizations: OrganizationModel[];
  @Input() public projects: ProjectModel[];

  @Output() public onResourceSelect = new EventEmitter<Resource>();

  public selectResource(model: ProjectModel | OrganizationModel) {
    this.onResourceSelect.emit({
      id: model.id,
      color: model.color,
      icon: model.icon,
      code: model.code,
      name: model.name,
      description: model.description,
    });
  }
}
