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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectNavigation, selectSearchTab} from '../../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Query} from '../../../core/store/navigation/query/query';
import {selectCurrentView, selectDefaultViewConfig} from '../../../core/store/views/views.state';
import {distinctUntilChanged, filter, map, pairwise, startWith, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';
import {createDefaultSearchConfig, DEFAULT_SEARCH_ID, Search, SearchConfig} from '../../../core/store/searches/search';
import {SearchesAction} from '../../../core/store/searches/searches.action';
import {parseSearchTabFromUrl, SearchTab} from '../../../core/store/navigation/search-tab';
import {Perspective} from '../perspective';
import {selectSearch, selectSearchById} from '../../../core/store/searches/searches.state';
import {DefaultViewConfig, View} from '../../../core/store/views/view';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {Workspace} from '../../../core/store/navigation/workspace';
import {ViewsAction} from '../../../core/store/views/views.action';

@Component({
  templateUrl: './search-perspective.component.html',
  styleUrls: ['./search-perspective.component.scss'],
  host: {class: 'search-perspective'},
})
export class SearchPerspectiveComponent implements OnInit, OnDestroy {
  public readonly searchTab = SearchTab;

  public stringQuery: string;

  private initialSearchTab: SearchTab;
  private workspace: Workspace;
  private query: Query = {};
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private activatedRoute: ActivatedRoute, private router: Router) {}

  public ngOnInit() {
    this.initialSearchTab = parseSearchTabFromUrl(this.router.url);
    this.resetDefaultConfigSnapshot();
    this.subscribeToNavigation();
    this.subscribeToConfig();
    this.subscribeToSearchTab();
  }

  private subscribeToNavigation() {
    const subscription = this.store$.pipe(select(selectNavigation)).subscribe(navigation => {
      if (navigation.query) {
        this.query = navigation.query;
        this.stringQuery = convertQueryModelToString(navigation.query);
      }
      this.workspace = navigation.workspace;
    });
    this.subscriptions.add(subscription);
  }

  public isLinkActive(url: string): boolean {
    return this.activatedRoute.firstChild.snapshot.url.join('/').includes(url);
  }

  private subscribeToConfig() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) => {
          if (view) {
            const searchId = view.code;
            return this.store$.pipe(
              select(selectSearchById(searchId)),
              take(1),
              map(search => {
                if (this.preferViewConfigUpdate(previousView, view, search)) {
                  return {searchId, config: view.config && view.config.search, view};
                }
                return {};
              })
            );
          } else {
            const searchId = DEFAULT_SEARCH_ID;
            return this.store$.pipe(
              select(selectDefaultViewConfig(Perspective.Search, searchId)),
              withLatestFrom(this.store$.pipe(select(selectSearchById(searchId)))),
              map(([defaultConfig, search], index) => {
                if (index === 0) {
                  this.setDefaultConfigSnapshot(defaultConfig);
                }
                return {
                  searchId,
                  config: (defaultConfig && defaultConfig && defaultConfig.config.search) || (search && search.config),
                };
              })
            );
          }
        })
      )
      .subscribe(({searchId, config, view}: {searchId?: string; config?: SearchConfig; view?: View}) => {
        if (searchId) {
          this.store$.dispatch(
            new SearchesAction.SetConfig({
              searchId,
              config: config || createDefaultSearchConfig(this.initialSearchTab),
            })
          );
          this.checkSearchTabRedirect(config, view);
        }
      });
    this.subscriptions.add(subscription);
  }

  private checkSearchTabRedirect(config: SearchConfig, view: View) {
    this.store$
      .pipe(
        select(selectSearchTab),
        take(1)
      )
      .subscribe(searchTab => {
        if (
          this.workspace &&
          config &&
          config.searchTab &&
          searchTab &&
          config.searchTab !== searchTab &&
          !this.initialSearchTab
        ) {
          const path: any[] = ['w', this.workspace.organizationCode, this.workspace.projectCode, 'view'];
          if (view) {
            path.push({vc: view.code});
          }
          path.push(...[Perspective.Search, config.searchTab]);
          this.router.navigate(path, {queryParamsHandling: 'preserve'});
        }
        this.initialSearchTab = null;
      });
  }

  private preferViewConfigUpdate(previousView: View, view: View, search: Search): boolean {
    if (!previousView) {
      return !search;
    }
    return !deepObjectsEquals(previousView.config && previousView.config.search, view.config && view.config.search);
  }

  private subscribeToSearchTab() {
    const subscription = this.selectCurrentTabWithSearch$().subscribe(({searchTab, search}) => {
      const {id: searchId, config} = search;
      if (searchId === DEFAULT_SEARCH_ID) {
        const searchConfig: SearchConfig = {...config, searchTab};
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfig({
            model: {
              key: searchId,
              perspective: Perspective.Search,
              config: {search: searchConfig},
            },
          })
        );
      } else {
        this.store$.dispatch(
          new SearchesAction.SetConfig({
            searchId,
            config: {...config, searchTab},
          })
        );
      }
    });
    this.subscriptions.add(subscription);
  }

  private selectCurrentTabWithSearch$(): Observable<{searchTab: SearchTab; search: Search}> {
    return this.store$.pipe(
      select(selectSearchTab),
      distinctUntilChanged(),
      withLatestFrom(this.store$.pipe(select(selectSearch))),
      withLatestFrom(this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_SEARCH_ID)))),
      filter(([[searchTab, search], defaultConfig]) => {
        const config =
          defaultConfig &&
          defaultConfig.config &&
          defaultConfig.config.search &&
          search &&
          search.id === DEFAULT_SEARCH_ID
            ? defaultConfig.config.search
            : search && search.config;
        return config && config.searchTab !== searchTab;
      }),
      map(([[searchTab, search]]) => ({searchTab, search}))
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private setDefaultConfigSnapshot(config: DefaultViewConfig) {
    if (config) {
      this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({model: config}));
    }
  }

  private resetDefaultConfigSnapshot() {
    this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({}));
  }
}
