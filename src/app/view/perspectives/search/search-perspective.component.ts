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

import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {
  NavigationState,
  selectNavigatingToOtherWorkspace,
  selectNavigation,
  selectPerspectiveSettings,
  selectSearchTab,
} from '../../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {selectCurrentView, selectDefaultViewConfig, selectViewQuery} from '../../../core/store/views/views.state';
import {
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {createDefaultSearchConfig, Search, SearchConfig} from '../../../core/store/searches/search';
import {SearchesAction} from '../../../core/store/searches/searches.action';
import {parseSearchTabFromUrl} from '../../../core/store/navigation/search-tab';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../perspective';
import {selectSearch, selectSearchById} from '../../../core/store/searches/searches.state';
import {DefaultViewConfig, View} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {isNavigatingToOtherWorkspace} from '../../../core/store/navigation/query/query.util';
import {convertPerspectiveSettingsToString} from '../../../core/store/navigation/settings/perspective-settings';
import {QueryParam} from '../../../core/store/navigation/query-param';
import {ModalService} from '../../../shared/modal/modal.service';
import {DashboardTab} from '../../../core/model/dashboard-tab';
import {selectSearchPerspectiveVisibleTabs} from '../../../core/store/common/permissions.selectors';

@Component({
  selector: 'search-perspective',
  templateUrl: './search-perspective.component.html',
  styleUrls: ['./search-perspective.component.scss'],
  host: {class: 'search-perspective'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPerspectiveComponent implements OnInit, OnDestroy {
  public queryParams$: Observable<Record<string, string>>;
  public tabs$: Observable<DashboardTab[]>;

  private initialSearchTab: string;
  private searchId: string;
  private subscriptions = new Subscription();

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private modalService: ModalService,
    private elementRef: ElementRef
  ) {}

  public ngOnInit() {
    this.initialSearchTab = parseSearchTabFromUrl(this.router.url);
    this.resetDefaultConfigSnapshot();
    this.subscribeToNavigation();
    this.subscribeToConfig();
    this.subscribeToSearchTab();
  }

  private subscribeToNavigation() {
    const stringQuery$ = this.store$.pipe(
      select(selectViewQuery),
      map(query => convertQueryModelToString(query))
    );
    const perspectiveSettingsString$ = this.store$.pipe(
      select(selectPerspectiveSettings),
      map(settings => convertPerspectiveSettingsToString(settings))
    );

    this.queryParams$ = combineLatest([stringQuery$, perspectiveSettingsString$]).pipe(
      map(([query, perspectiveSettings]) => {
        const queryParams = {};
        if (query) {
          queryParams[QueryParam.Query] = query;
        }
        if (perspectiveSettings) {
          queryParams[QueryParam.PerspectiveSettings] = perspectiveSettings;
        }

        if (Object.keys(queryParams).length) {
          return queryParams;
        }

        return null;
      })
    );

    this.tabs$ = this.store$.pipe(select(selectSearchPerspectiveVisibleTabs));
  }

  private subscribeToConfig() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        tap(([previousView, view]) => this.checkNewView(previousView, view)),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        ),
        withLatestFrom(this.store$.pipe(select(selectNavigatingToOtherWorkspace))),
        filter(([, navigating]) => !navigating),
        map(([data]) => data)
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
        this.searchId = searchId;
      });
    this.subscriptions.add(subscription);
  }

  private checkNewView(previousView: View, currentView: View) {
    if (!previousView && currentView?.perspective === Perspective.Search) {
      this.elementRef?.nativeElement?.scrollTo(0, 0);
    }
  }

  private subscribeToView(
    previousView: View,
    view: View
  ): Observable<{searchId: string; config: SearchConfig; view: View}> {
    const searchId = view.code;
    return this.store$.pipe(
      select(selectSearchById(searchId)),
      take(1),
      map(search => {
        const searchConfig = view.config?.search;
        if (preferViewConfigUpdate(previousView?.config?.search, view?.config?.search, !!search)) {
          return {searchId, config: searchConfig, view};
        }
        return {searchId, config: search?.config || searchConfig || createDefaultSearchConfig(), view};
      })
    );
  }

  private subscribeToDefault(): Observable<{searchId?: string; config?: SearchConfig; view?: View}> {
    const searchId = DEFAULT_PERSPECTIVE_ID;
    return this.store$.pipe(
      select(selectDefaultViewConfig(Perspective.Search, searchId)),
      withLatestFrom(this.store$.pipe(select(selectSearchById(searchId)))),
      map(([defaultConfig, search], index) => {
        if (index === 0) {
          this.setDefaultConfigSnapshot(defaultConfig);
        }
        return {
          searchId,
          config: defaultConfig?.config?.search || search?.config,
        };
      })
    );
  }

  private checkSearchTabRedirect(config: SearchConfig, view: View) {
    this.store$
      .pipe(select(selectSearchTab), take(1), withLatestFrom(this.store$.pipe(select(selectNavigation)), this.tabs$))
      .subscribe(([searchTab, navigation, tabs]) => {
        if (this.shouldRedirectToTab(config, navigation, searchTab, tabs)) {
          const path: any[] = ['w', navigation.workspace.organizationCode, navigation.workspace.projectCode, 'view'];
          if (view) {
            path.push({vc: view.code});
          }
          path.push(Perspective.Search);
          if (tabs.some(tab => tab.id === config.searchTab)) {
            path.push(config.searchTab);
          } else if (tabs.length) {
            path.push(tabs[0].id);
          }
          this.router.navigate(path, {queryParamsHandling: 'preserve'});
        }
        this.initialSearchTab = null;
      });
  }

  private shouldRedirectToTab(
    config: SearchConfig,
    navigation: NavigationState,
    currentTab: string,
    tabs: DashboardTab[]
  ): boolean {
    if (!navigation.workspace || isNavigatingToOtherWorkspace(navigation.workspace, navigation.navigatingWorkspace)) {
      return false;
    }

    // tab is hidden or no longer exist
    if (!tabs.some(tab => tab.id === currentTab)) {
      return true;
    }

    // tab changed in config (i.e. in other browser window)
    return currentTab && config?.searchTab && currentTab !== config.searchTab && !this.initialSearchTab;
  }

  private subscribeToSearchTab() {
    const subscription = this.selectCurrentTabWithSearch$().subscribe(({searchTab, search}) => {
      const {id: searchId, config} = search;
      if (searchId === DEFAULT_PERSPECTIVE_ID) {
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

  private selectCurrentTabWithSearch$(): Observable<{searchTab: string; search: Search}> {
    return this.store$.pipe(
      select(selectSearchTab),
      distinctUntilChanged(),
      withLatestFrom(this.store$.pipe(select(selectSearch))),
      withLatestFrom(this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_PERSPECTIVE_ID)))),
      filter(([[searchTab, search], defaultConfig]) => {
        const config =
          defaultConfig?.config?.search && search?.id === DEFAULT_PERSPECTIVE_ID
            ? defaultConfig.config.search
            : search?.config;
        return search && config?.searchTab !== searchTab;
      }),
      map(([[searchTab, search]]) => ({searchTab: searchTab, search}))
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

  public onSettingsClick() {
    const currentTab = parseSearchTabFromUrl(this.router.url);
    this.modalService.showTabsSettings(this.searchId, currentTab);
  }

  public trackByTab(index: number, tab: DashboardTab): string {
    return tab.id;
  }
}
