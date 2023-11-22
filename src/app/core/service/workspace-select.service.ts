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
import {Injectable} from '@angular/core';
import {NavigationExtras, Router} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {filter, map, mergeMap, take} from 'rxjs/operators';

import {CreateResourceModalComponent} from '../../shared/modal/create-resource/create-resource-modal.component';
import {ModalService} from '../../shared/modal/modal.service';
import {userHasRoleInOrganization} from '../../shared/utils/permission.utils';
import {Perspective} from '../../view/perspectives/perspective';
import {ResourceType} from '../model/resource-type';
import {RoleType} from '../model/role-type';
import {AppState} from '../store/app.state';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {Organization} from '../store/organizations/organization';
import {Project} from '../store/projects/project';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from '../store/projects/projects.state';
import {User} from '../store/users/user';
import {selectCurrentUserForWorkspace} from '../store/users/users.state';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceSelectService {
  private currentUser: User;

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private modalService: ModalService
  ) {
    this.store$.pipe(select(selectCurrentUserForWorkspace)).subscribe(user => (this.currentUser = user));
  }

  public selectOrganization(organization: Organization) {
    if (!organization) {
      return;
    }

    this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));

    this.store$
      .pipe(
        select(selectProjectsLoadedForOrganization(organization.id)),
        filter(loaded => loaded),
        mergeMap(() => this.store$.pipe(select(selectProjectsByOrganizationId(organization.id)))),
        take(1),
        map(projects => projects?.[0])
      )
      .subscribe(project => {
        if (project) {
          this.goToProject(organization, project);
        } else {
          this.checkAndCreateNewProject(organization);
        }
      });
  }

  private goToProject(organization: Organization, project: Project, extras?: NavigationExtras) {
    if (organization && project) {
      this.router.navigate(['w', organization.code, project.code, 'view', Perspective.Search], extras);
    }
  }

  private checkAndCreateNewProject(organization: Organization) {
    if (userHasRoleInOrganization(organization, this.currentUser, RoleType.ProjectContribute)) {
      this.createNewProject(organization);
    } else {
      this.dispatchErrorCreateProjectNotification();
    }
  }

  private dispatchErrorCreateProjectNotification() {
    const message = $localize`:@@projects.notPermissions:I am sorry, you are not allowed to view or create any project in this organization.`;
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  public createNewProject(organization: Organization): BsModalRef {
    return this.modalService.showCreateProjectDialog([organization], organization);
  }

  public createNewProjectWithTemplate(
    writableOrganizations: Organization[],
    organization: Organization,
    templateCode: string,
    extras?: NavigationExtras
  ): BsModalRef {
    return this.modalService.showCreateProjectDialog(writableOrganizations, organization, templateCode, extras);
  }

  public copyProject(
    writableOrganizations: Organization[],
    organizationId: string,
    projectId: string,
    extras?: NavigationExtras
  ): BsModalRef {
    return this.modalService.showCopyProjectDialog(writableOrganizations, organizationId, projectId, extras);
  }

  public selectProject(organization: Organization, project: Project) {
    this.goToProject(organization, project);
  }

  public createNewOrganization(extras?: NavigationExtras): BsModalRef {
    return this.openCreateOrganizationModal(organization =>
      this.createNewProjectWithTemplate([organization], organization, null, extras)
    );
  }

  private openCreateOrganizationModal(callback: (Organization) => void): BsModalRef {
    const initialState = {resourceType: ResourceType.Organization, callback};
    const config = {initialState, keyboard: false};
    config['backdrop'] = 'static';
    return this.modalService.show(CreateResourceModalComponent, config);
  }
}
