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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Workspace} from '../../../store/navigation/workspace.model';
import {Resource} from '../../../dto';
import {Router} from '@angular/router';
import {OrganizationModel} from '../../../store/organizations/organization.model';
import {ProjectModel} from '../../../store/projects/project.model';
import {ResourceType} from '../../../model/resource-type';
import {Observable} from 'rxjs/internal/Observable';
import {AppState} from '../../../store/app.state';
import {Store} from '@ngrx/store';
import {selectOrganizationByWorkspace} from '../../../store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../store/projects/projects.state';

@Component({
  selector: 'resource-detail',
  templateUrl: './resource-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourceDetailComponent implements OnInit {

  @Input() public type: ResourceType;
  @Input() public resource: Resource;
  @Input() public workspace: Workspace;

  public organization$: Observable<OrganizationModel>;
  public project$: Observable<ProjectModel>;

  constructor(private store: Store<AppState>,
              private router: Router) {
  }

  public ngOnInit() {
    this.organization$ = this.store.select(selectOrganizationByWorkspace);
    this.project$ = this.store.select(selectProjectByWorkspace);
  }

  public isOrganizationType(): boolean {
    return this.type === ResourceType.Organization;
  }

  public goToOrganizationSettings(page: string) {
    if (this.workspace && this.workspace.organizationCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, page]);
    }
  }

  public goToProjectSettings(page: string) {
    if (this.workspace && this.workspace.organizationCode && this.workspace.projectCode) {
      this.router.navigate(['organization', this.workspace.organizationCode, 'project', this.workspace.projectCode, page]);
    }
  }

}
