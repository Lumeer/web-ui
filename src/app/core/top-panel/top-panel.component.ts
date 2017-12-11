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

import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {HtmlModifier} from '../../shared/utils/html-modifier';
import {AppState} from '../store/app.state';
import {selectNavigation} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';
import {Router} from '@angular/router';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {ProjectsAction} from '../store/projects/projects.action';

@Component({
  selector: 'top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.scss']
})
export class TopPanelComponent implements OnInit {

  public licence = 'trial';

  public searchBoxHidden = false;
  public notifications = 0;

  public workspace: Workspace;

  constructor(private store: Store<AppState>,
              private router: Router) {
  }

  public ngOnInit() {
    this.store.select(selectNavigation).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.searchBoxHidden = navigation.searchBoxHidden;
    });
  }

  public goToWorkspaceOrganization(): void {
    this.store.dispatch(new OrganizationsAction.Select({organizationCode: this.workspace.organizationCode}));
    this.store.dispatch(new ProjectsAction.Select({projectCode: null}));

    this.router.navigate(['/workspace']);
  }

  public goToWorkspaceProject(): void {
    this.store.dispatch(new OrganizationsAction.Select({organizationCode: this.workspace.organizationCode}));
    this.store.dispatch(new ProjectsAction.Select({projectCode: this.workspace.projectCode}));

    this.router.navigate(['/workspace']);
  }

  public isWorkspaceSet(): boolean {
    return !!this.workspace && !!this.workspace.organizationCode && !!this.workspace.projectCode;
  }

  public isSearchBoxShown(): boolean {
    return this.isWorkspaceSet() && !this.searchBoxHidden;
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

}
