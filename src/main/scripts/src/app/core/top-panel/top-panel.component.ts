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
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';

import {WorkspaceService} from '../workspace.service';
import {RouteFinder} from '../../shared/utils/route-finder';
import {HtmlModifier} from '../../shared/utils/html-modifier';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit {

  public licence = 'trial';

  public searchBoxHidden = false;
  public notifications = 0;

  constructor(private activatedRoute: ActivatedRoute,
              private router: Router,
              public workspaceService: WorkspaceService) {
  }

  public ngOnInit() {
    this.detectSearchBoxHiddenProperty();
  }

  private detectSearchBoxHiddenProperty() {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map(route => RouteFinder.getDeepestChildRoute(route))
      .filter(route => route.outlet === 'primary')
      .mergeMap(route => route.data)
      .subscribe((data: { searchBoxHidden: boolean }) => {
        this.searchBoxHidden = Boolean(data.searchBoxHidden);
      });
  }

  public isSearchBoxShown(): boolean {
    return this.workspaceService.isWorkspaceSet() && !this.searchBoxHidden;
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }
}
