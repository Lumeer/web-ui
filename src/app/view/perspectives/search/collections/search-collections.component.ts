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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';

import {Query} from '../../../../core/dto/query';
import {AppState} from '../../../../core/store/app.state';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {Subscription} from 'rxjs/Subscription';
import {ProjectService} from '../../../../core/rest/project.service';
import {Role} from '../../../../shared/permissions/role';
import {Observable} from 'rxjs/Observable';
import {map} from 'rxjs/operators';

@Component({
  templateUrl: './search-collections.component.html'
})
export class SearchCollectionsComponent implements OnInit, OnDestroy {

  public query: Query = {};

  private subscription: Subscription;

  private hasWriteRole: Observable<boolean>;

  constructor(private store: Store<AppState>,
              private projectService: ProjectService) {
  }

  public ngOnInit() {
    this.subscription = this.store.select(selectNavigation)
      .subscribe(navigation => this.query = navigation.query);

    this.hasWriteRole = this.projectService.getPermissions().pipe(
      map(permissions => permissions.users.some(permission => permission.roles.includes(Role.Write)))
    );
  }

  public ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
