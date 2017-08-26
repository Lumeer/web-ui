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

import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Router, RoutesRecognized} from '@angular/router';

import {WorkspaceService} from './core/workspace.service';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['../styles/basic.scss', './app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  public notificationsOptions = {
    position: ['top'],
    timeOut: 1000,
    showProgressBar: true,
    animate: 'fromLeft',
    lastOnBottom: true
  };

  constructor(private workspaceService: WorkspaceService,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.router.events.subscribe(events => {
      if (events instanceof RoutesRecognized) {
        let params = events.state.root.firstChild.params;
        let organizationCode = params['organizationCode'];
        let projectCode = params['projectCode'];
        if (organizationCode && projectCode) {
          this.workspaceService.organizationCode = organizationCode;
          this.workspaceService.projectCode = projectCode;
        }
      }
    });
  }

}
