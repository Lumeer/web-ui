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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';

import {AppState} from '../../../../core/store/app.state';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {View} from '../../../../core/store/views/view';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {QueryData} from '../../../../shared/top-panel/search-box/util/query-data';
import {map, tap} from 'rxjs/operators';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {selectViewsByQuery} from '../../../../core/store/common/permissions.selectors';
import {SearchConfig, SearchViewsConfig} from '../../../../core/store/searches/search';
import {selectSearchConfig, selectSearchId} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../perspective';
import {selectViewQuery} from '../../../../core/store/views/views.state';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {selectViewsPermissions} from '../../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'search-views',
  templateUrl: './search-views.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchViewsComponent implements OnInit, OnDestroy {
  @Input()
  public maxLines: number = -1;

  public views$: Observable<View[]>;
  public queryData$: Observable<QueryData>;
  public query$: Observable<Query>;
  public workspace$: Observable<Workspace>;
  public viewsConfig$: Observable<SearchViewsConfig>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;

  private config: SearchConfig;
  private searchId: string;
  private subscriptions = new Subscription();

  constructor(private notificationService: NotificationService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(select(selectViewsByQuery));
    this.query$ = this.store$.pipe(select(selectViewQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.queryData$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => ({collections, linkTypes})));
    this.viewsConfig$ = this.selectViewsConfig$();
    this.permissions$ = this.store$.pipe(select(selectViewsPermissions));

    this.subscribeSearchId();
  }

  private subscribeSearchId() {
    this.subscriptions.add(this.store$.pipe(select(selectSearchId)).subscribe(searchId => (this.searchId = searchId)));
  }

  private selectViewsConfig$(): Observable<SearchViewsConfig> {
    return this.store$.pipe(
      select(selectSearchConfig),
      tap(config => (this.config = config)),
      map(config => config && config.views)
    );
  }

  public onConfigChange(viewsConfig: SearchViewsConfig) {
    if (this.searchId) {
      const searchConfig = {...this.config, views: viewsConfig};
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config: searchConfig}));
      if (this.searchId === DEFAULT_PERSPECTIVE_ID) {
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfig({
            model: {
              key: DEFAULT_PERSPECTIVE_ID,
              perspective: Perspective.Search,
              config: {search: searchConfig},
            },
          })
        );
      }
    }
  }

  public onDeleteView(view: View) {
    const message = $localize`:@@views.delete.message:Do you really want to permanently delete this view?`;
    const title = $localize`:@@views.delete.title:Delete view?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteView(view));
  }

  public deleteView(view: View) {
    this.store$.dispatch(new ViewsAction.Delete({viewId: view.id}));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
