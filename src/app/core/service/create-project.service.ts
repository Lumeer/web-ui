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
import {Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {Organization} from '../store/organizations/organization';
import * as Colors from '../../shared/picker/colors';
import {safeGetRandomIcon} from '../../shared/picker/icons';
import {Project} from '../store/projects/project';
import {ProjectsAction} from '../store/projects/projects.action';
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
  constructor(private store$: Store<AppState>) {}

  public createProjectInOrganization(organization: Organization, initialCode: string, payload: ProjectCreatePayload) {
    const colors = Colors.palette;
    const color = colors[Math.round(Math.random() * colors.length)];
    const icon = safeGetRandomIcon();
    const project: Project = {code: initialCode, name: '', organizationId: organization.id, icon, color};

    this.store$.dispatch(
      new ProjectsAction.Create({
        project,
        ...payload,
      })
    );
  }
}
