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
import {select, Store} from '@ngrx/store';
import {NotificationService} from '../../../../../core/notifications/notification.service';
import {AppState} from '../../../../../core/store/app.state';
import {SearchViewsDirective} from '../search-views.directive';
import {Observable} from 'rxjs';
import {selectViewFolderPath} from '../../../../../core/store/navigation/navigation.state';
import {NavigationAction} from '../../../../../core/store/navigation/navigation.action';
import {PerspectiveSettings} from '../../../../../core/store/navigation/settings/perspective-settings';
import {ViewsAction} from '../../../../../core/store/views/views.action';

@Component({
  selector: 'search-views-folders',
  templateUrl: './search-views-folders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewsFoldersComponent extends SearchViewsDirective implements OnInit, OnDestroy {
  public foldersPath$: Observable<string[]>;

  constructor(
    protected notificationService: NotificationService,
    protected store$: Store<AppState>
  ) {
    super(notificationService, store$);
  }

  public ngOnInit() {
    super.ngOnInit();

    this.foldersPath$ = this.store$.pipe(select(selectViewFolderPath));
  }

  public onFolderPathChange(foldersPath: string[]) {
    const settings: PerspectiveSettings = {viewFolderPath: foldersPath};
    this.store$.dispatch(new NavigationAction.SetPerspectiveSettings({settings}));
  }

  public onViewFoldersChange(data: {viewId: string; folders: string[]}) {
    this.store$.dispatch(new ViewsAction.SetViewFolders(data));
  }
}
