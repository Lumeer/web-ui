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
import {ActivatedRoute, NavigationEnd, ParamMap, Router} from '@angular/router';

import {WorkspaceService} from './core/workspace.service';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./shared/common.scss', './app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  public notificationsOptions = {
    position: ['top'],
    timeOut: 1500,
    showProgressBar: true,
    animate: 'fromLeft',
    lastOnBottom: true
  };

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              private workspaceService: WorkspaceService) {
  }

  public ngOnInit() {
    this.processPathParams();
  }

  private processPathParams() {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map(route => AppComponent.getFirstChildRouteWithParams(route))
      .filter(route => route.outlet === 'primary')
      .mergeMap(route => route.paramMap)
      .subscribe((params: ParamMap) => this.setWorkspace(params));
  }

  private setWorkspace(params: ParamMap) {
    this.workspaceService.organizationCode = params.get('organizationCode');
    this.workspaceService.projectCode = params.get('projectCode');
    this.workspaceService.collectionCode = params.get('collectionCode');
    this.workspaceService.viewCode = params.get('viewCode');
  }

  private static getFirstChildRouteWithParams(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
      if (route.snapshot.paramMap.keys.length > 0) {
        return route;
      }
    }
    return route;
  }

}
