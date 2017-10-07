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
