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

import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, NavigationEnd, ParamMap, Router} from '@angular/router';

import {SnotifyPosition, SnotifyService} from 'ng-snotify';

import {WorkspaceService} from './core/workspace.service';
import {RouteFinder} from './shared/utils/route-finder';
import {filter, map, mergeMap} from 'rxjs/operators';

@Component({
  selector: 'app',
  templateUrl: './app.component.html',
  styleUrls: ['./shared/common.scss', './app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              private workspaceService: WorkspaceService,
              private notificationService: SnotifyService) {
  }

  public ngOnInit() {
    this.processPathParams();
    this.setNotificationStyle();
  }

  private processPathParams() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => RouteFinder.getFirstChildRouteWithParams(route)),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.paramMap),
    ).subscribe((params: ParamMap) => this.setWorkspace(params));
  }

  private setWorkspace(params: ParamMap) {
    this.workspaceService.organizationCode = params.get('organizationCode');
    this.workspaceService.projectCode = params.get('projectCode');
    this.workspaceService.collectionCode = params.get('collectionCode');
    this.workspaceService.viewCode = params.get('viewCode');
  }

  public setNotificationStyle(): void {
    this.notificationService.setDefaults({
      toast: {
        titleMaxLength: 15,
        backdrop: -1,
        position: SnotifyPosition.leftTop,
        timeout: 3000,
        showProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false
      }
    });
  }

}
