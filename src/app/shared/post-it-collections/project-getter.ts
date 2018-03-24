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

import {Subscription} from 'rxjs/Subscription';
import {ProjectModel} from '../../core/store/projects/project.model';
import {AppState} from '../../core/store/app.state';
import {Store} from '@ngrx/store';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectOrganizationByCode} from '../../core/store/organizations/organizations.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {selectProjectByCode} from '../../core/store/projects/projects.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';

export class ProjectGetter {

  private subscriptions = new Subscription();

  public project: ProjectModel;

  constructor(private store: Store<AppState>) {
  }

  public getProject(organizationCode: string, projectCode: string) {
    this.destroy();
    this.subscribeOnOrganization(organizationCode, projectCode);
  }

  private subscribeOnOrganization(organizationCode: string, projectCode: string) {
    this.store.dispatch(new OrganizationsAction.Get());

    const organizationSubscription = this.store.select(selectOrganizationByCode(organizationCode)).subscribe(organization => {
      this.subscribeOnProject(organization, projectCode);
    });

    this.subscriptions.add(organizationSubscription);
  }

  private subscribeOnProject(organization: OrganizationModel, projectCode: string) {
    this.store.dispatch(new ProjectsAction.Get({organizationId: organization.id}));

    const projectSubscription = this.store.select(selectProjectByCode(projectCode)).subscribe(project => {
      this.project = project;
    });

    this.subscriptions.add(projectSubscription);
  }

  public destroy() {
    this.subscriptions.unsubscribe();
  }

}
