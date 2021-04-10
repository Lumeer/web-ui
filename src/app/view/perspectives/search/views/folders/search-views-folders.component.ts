/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {NotificationService} from '../../../../../core/notifications/notification.service';
import {AppState} from '../../../../../core/store/app.state';
import {SearchViewsComponent} from '../search-views.component';

@Component({
  selector: 'search-views-folders',
  templateUrl: './search-views-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewsFoldersComponent extends SearchViewsComponent implements OnInit, OnDestroy {
  constructor(protected notificationService: NotificationService, protected store$: Store<AppState>) {
    super(notificationService, store$);
  }
}
