/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {WorkspaceService} from './workspace.service';
import {UserSettingsService} from './user-settings.service';

@Component({
  template: ''
})
export class HomeComponent implements OnInit {

  constructor(private router: Router,
              private userSettingsService: UserSettingsService,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    const userSettings = this.userSettingsService.getUserSettings();
    this.workspaceService.organizationCode = userSettings.defaultOrganization;
    this.workspaceService.projectCode = userSettings.defaultProject;

    if (this.workspaceService.isWorkspaceSet()) {
      this.router.navigate(['/w', userSettings.defaultOrganization, userSettings.defaultProject, 'search']);
    } else {
      this.router.navigate(['/workspace']);
    }
  }

}
