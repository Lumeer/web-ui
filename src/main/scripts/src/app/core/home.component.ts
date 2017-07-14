/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {WorkspaceService} from './workspace.service';
import {UserSettingsService} from './rest/user-settings.service';
import {UserSettings} from './dto/user.settings';

@Component({
  template: ''
})
export class HomeComponent implements OnInit {

  constructor(private router: Router,
              private userSettingsService: UserSettingsService,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit(): void {
    this.userSettingsService.getUserSettings()
      .subscribe((userSettings: UserSettings) => {
        this.workspaceService.organizationCode = userSettings.defaultOrganization;
        this.workspaceService.projectCode = userSettings.defaultProject;

        if (this.workspaceService.isWorkspaceSet()) {
          this.router.navigate(['/w', userSettings.defaultOrganization, userSettings.defaultProject, 'search']);
        } else {
          this.router.navigate(['/workspace']);
        }
      }, error => {
        this.router.navigate(['/workspace']);
      });
  }

}
