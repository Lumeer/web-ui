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

import {Injectable} from '@angular/core';
import {AppState} from '../store/app.state';
import {select, Store} from '@ngrx/store';
import {DialogService} from '../../dialog/dialog.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {User} from '../store/users/user';
import {selectCurrentUser} from '../store/users/users.state';
import {Organization} from '../store/organizations/organization';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from '../store/projects/projects.state';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {Project} from '../store/projects/project';
import {RouterAction} from '../store/router/router.action';
import {userHasRoleInResource} from '../../shared/utils/resource.utils';
import {Role} from '../model/role';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceSelectService {
  private currentUser: User;

  constructor(
    private store$: Store<AppState>,
    private dialogService: DialogService,
    private i18n: I18n,
    private router: Router
  ) {
    this.store$.pipe(select(selectCurrentUser)).subscribe(user => (this.currentUser = user));
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
        map(projects => projects.length > 0 && projects[0])
      )
      .subscribe(project => {
        if (project) {
          this.goToProject(organization, project);
        } else {
          this.checkAndCreateNewProject(organization);
        }
      });
  }

  private goToProject(organization: Organization, project: Project) {
    if (organization && project) {
      this.router.navigate(['w', organization.code, project.code, 'view', 'search', 'all']);
    }
  }

  private checkAndCreateNewProject(organization: Organization) {
    if (userHasRoleInResource(this.currentUser, organization, Role.Write)) {
      this.createNewProject(organization);
    } else {
      this.dispatchErrorCreateProjectNotification();
    }
  }

  private dispatchErrorCreateProjectNotification() {
    const message = this.i18n({
      id: 'projects.notPermissions',
      value: 'We are sorry, but you are not allowed to view or create any project in this organization.',
    });
    this.store$.dispatch(new NotificationsAction.Error({message}));
  }

  public createNewProject(organization: Organization) {
    this.dialogService.openCreateProjectDialog(organization.id, project => this.goToProject(organization, project));
  }

  public selectProject(organization: Organization, project: Project) {
    this.goToProject(organization, project);
  }

  public createNewOrganization() {
    this.dialogService.openCreateOrganizationDialog(organization => this.createNewProject(organization));
  }
}
