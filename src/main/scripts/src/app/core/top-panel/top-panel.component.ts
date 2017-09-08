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
import {NavigationEnd, Router} from '@angular/router';

import {WorkspaceService} from '../workspace.service';
import 'rxjs/add/operator/filter';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit {

  public licence = 'trial';

  public searchBoxHidden = false;

  constructor(private router: Router,
              public workspaceService: WorkspaceService) {
  }

  public ngOnInit() {
    this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.searchBoxHidden = TopPanelComponent.showOrHideSearchBox(event.url);
      });
  }

  private static showOrHideSearchBox(url: string): boolean {
    return url.endsWith('search') || url.endsWith('workspace') || url.includes('organization');
  }

  public isSearchBoxShown(): boolean {
    return this.workspaceService.isWorkspaceSet() && !this.searchBoxHidden;
  }
}
