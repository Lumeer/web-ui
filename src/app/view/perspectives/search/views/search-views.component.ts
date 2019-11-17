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

import {Component, Input} from '@angular/core';
import {select, Store} from '@ngrx/store';

import {AppState} from '../../../../core/store/app.state';
import {combineLatest, Observable} from 'rxjs';
import {selectViewsLoaded} from '../../../../core/store/views/views.state';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {View} from '../../../../core/store/views/view';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {QueryData} from '../../../../shared/top-panel/search-box/util/query-data';
import {map, tap} from 'rxjs/operators';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {selectViewsByQuery} from '../../../../core/store/common/permissions.selectors';
import {DEFAULT_SEARCH_ID, SearchConfig, SearchViewsConfig} from '../../../../core/store/searches/search';
import {selectSearchConfig} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';

@Component({
  selector: 'search-views',
  templateUrl: './search-views.component.html',
})
export class SearchViewsComponent {
  @Input()
  public maxLines: number = -1;

  public views$: Observable<View[]>;
  public queryData$: Observable<QueryData>;
  public query$: Observable<Query>;
  public workspace$: Observable<Workspace>;
  public loaded$: Observable<boolean>;
  public viewsConfig$: Observable<SearchViewsConfig>;

  private config: SearchConfig;
  private searchId = DEFAULT_SEARCH_ID;

  constructor(private i18n: I18n, private notificationService: NotificationService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(select(selectViewsByQuery));
    this.query$ = this.store$.pipe(select(selectQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.loaded$ = this.store$.pipe(select(selectViewsLoaded));
    this.queryData$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => ({collections, linkTypes})));
    this.viewsConfig$ = this.selectViewsConfig$();
  }

  private selectViewsConfig$(): Observable<SearchViewsConfig> {
    return this.store$.pipe(
      select(selectSearchConfig),
      tap(config => (this.config = config)),
      map(config => config && config.views)
    );
  }

  public onConfigChange(viewsConfig: SearchViewsConfig) {
    const config = {...this.config, views: viewsConfig};
    this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config}));
  }

  public onDeleteView(view: View) {
    const message = this.i18n({
      id: 'views.delete.message',
      value: 'Do you really want to permanently delete this view?',
    });
    const title = this.i18n({id: 'views.delete.title', value: 'Delete view?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteView(view), bold: false},
    ]);
  }

  public deleteView(view: View) {
    this.store$.dispatch(new ViewsAction.Delete({viewId: view.id}));
  }
}
