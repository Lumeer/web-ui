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

import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectNavigation} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {convertQueryModelToString} from '../../../core/store/navigation/query.converter';
import {Query} from '../../../core/store/navigation/query';

@Component({
  templateUrl: './search-perspective.component.html',
  styleUrls: ['./search-perspective.component.scss'],
})
export class SearchPerspectiveComponent {
  public query: Query = {};

  private workspace: Workspace;

  constructor(private store: Store<AppState>, private activatedRoute: ActivatedRoute) {}

  public ngOnInit() {
    this.store.select(selectNavigation).subscribe(navigation => {
      this.workspace = navigation.workspace;
      this.query = navigation.query;
    });
  }

  public isLinkActive(url: string): boolean {
    return this.activatedRoute.firstChild.snapshot.url.join('/').includes(url);
  }

  public viewPath(searchTab: string): string[] {
    return [
      'w',
      this.workspace.organizationCode,
      this.workspace.projectCode,
      'view',
      this.workspace.viewCode,
      'search',
      searchTab,
    ];
  }

  public stringifyQuery(): string {
    return convertQueryModelToString(this.query);
  }
}
