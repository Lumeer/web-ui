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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {ResourceType} from '../../../../../core/model/resource-type';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {Resource} from '../../../../../core/model/resource';

@Component({
  selector: 'resource-detail',
  templateUrl: './resource-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDetailComponent {
  @Input() public type: ResourceType;
  @Input() public resource: Resource;
  @Input() public workspace: Workspace;

  constructor(private router: Router) {}

  public goToOrganizationSettings(page: string) {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, page]);
    }
  }

  public goToProjectSettings(page: string) {
    if (this.workspace && this.workspace.organizationCode && this.workspace.projectCode) {
      this.router.navigate([
        'organization',
        this.workspace.organizationCode,
        'project',
        this.workspace.projectCode,
        page,
      ]);
    }
  }
}
