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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter, tap} from 'rxjs/operators';
import {Resource} from '../../../../../core/dto';
import {ResourceType} from '../../../../../core/model/resource-type';
import {AppState} from '../../../../../core/store/app.state';
import {Workspace} from '../../../../../core/store/navigation/workspace.model';
import {OrganizationModel} from '../../../../../core/store/organizations/organization.model';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../../../../core/store/projects/project.model';
import {selectProjectByWorkspace} from '../../../../../core/store/projects/projects.state';
import {UsersAction} from '../../../../../core/store/users/users.action';

@Component({
  selector: 'resource-detail',
  templateUrl: './resource-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceDetailComponent implements OnInit, OnDestroy {
  @Input() public type: ResourceType;
  @Input() public resource: Resource;
  @Input() public workspace: Workspace;

  private subscriptions = new Subscription();

  public organization: OrganizationModel;
  public project: ProjectModel;

  constructor(private store: Store<AppState>, private router: Router) {}

  public ngOnInit() {
    this.subscriptions.add(
      this.store
        .select(selectOrganizationByWorkspace)
        .pipe(
          filter(organization => !!organization),
          tap(organization => this.store.dispatch(new UsersAction.Get({organizationId: organization.id})))
        )
        .subscribe(organization => (this.organization = organization))
    );
    this.subscriptions.add(this.store.select(selectProjectByWorkspace).subscribe(project => (this.project = project)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
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
