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
import {User} from '../store/users/user';
import {select, Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {selectCurrentUser} from '../store/users/users.state';
import {Organization} from '../store/organizations/organization';
import * as Colors from '../../shared/picker/colors';
import {safeGetRandomIcon} from '../../shared/picker/icons';
import {createUniqueCode} from '../../shared/utils/string.utils';
import {Project} from '../store/projects/project';
import {ProjectsAction} from '../store/projects/projects.action';
import {selectProjectsCodesForOrganization} from '../store/projects/projects.state';
import {take} from 'rxjs/operators';
import {NavigationExtras} from '@angular/router';

type ProjectCreatePayload = {
  templateId?: string;
  copyProject?: Project;
  navigationExtras?: NavigationExtras;
  onSuccess?: (project: Project) => void;
  onFailure?: () => void;
};

@Injectable({
  providedIn: 'root',
})
export class CreateProjectService {
  private currentUser: User;

  constructor(private store$: Store<AppState>) {
    this.store$.pipe(select(selectCurrentUser)).subscribe(user => (this.currentUser = user));
  }

  public createProjectInOrganization(organization: Organization, initialCode: string, payload: ProjectCreatePayload) {
    this.store$
      .pipe(select(selectProjectsCodesForOrganization(organization.id)), take(1))
      .subscribe(codes => this.createProject(organization, initialCode, codes, payload));
  }

  private createProject(
    organization: Organization,
    initialCode: string,
    usedCodes: string[],
    payload: ProjectCreatePayload
  ) {
    const colors = Colors.palette;
    const color = colors[Math.round(Math.random() * colors.length)];
    const icon = safeGetRandomIcon();
    const code = createUniqueCode(initialCode, usedCodes);
    const project: Project = {code, name: '', organizationId: organization.id, icon, color};

    this.store$.dispatch(
      new ProjectsAction.Create({
        project,
        ...payload,
      })
    );
  }
}
