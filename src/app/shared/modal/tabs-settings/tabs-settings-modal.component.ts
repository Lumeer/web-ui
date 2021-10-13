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

import {Component, ChangeDetectionStrategy, ViewChild, OnInit, Input, OnDestroy} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BehaviorSubject, Observable, of, combineLatest, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {DashboardTab} from '../../../core/model/dashboard-tab';
import {TabsSettingsContentComponent} from './content/tabs-settings-content.component';
import {
  selectCurrentView,
  selectDefaultSearchPerspectiveDashboardViewId,
  selectSearchPerspectiveTabsByView,
  selectViewById,
} from '../../../core/store/views/views.state';
import {ViewsAction} from '../../../core/store/views/views.action';
import {createDashboardTabId, isViewValidForDashboard} from '../../utils/dashboard.utils';
import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';
import {selectSearchConfigById} from '../../../core/store/searches/searches.state';
import {distinctUntilChanged, map, pairwise, startWith, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {Dashboard, SearchConfig} from '../../../core/store/searches/search';
import {SearchesAction} from '../../../core/store/searches/searches.action';
import {View} from '../../../core/store/views/view';
import {selectViewsByReadWithComputedData} from '../../../core/store/common/permissions.selectors';
import {AllowedPermissions, completeAllowedPermissions} from '../../../core/model/allowed-permissions';
import {selectViewPermissions} from '../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'tabs-settings-modal',
  templateUrl: './tabs-settings-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsSettingsModalComponent implements OnInit, OnDestroy {
  @Input()
  public perspectiveId: string;

  @Input()
  public initialTab: string;

  @ViewChild(TabsSettingsContentComponent)
  public content: TabsSettingsContentComponent;

  public readonly dialogType = DialogType;

  private defaultConfig$ = new BehaviorSubject<SearchConfig>(null);
  public selectedViewId$ = new BehaviorSubject<string>(null);
  public performingAction$ = new BehaviorSubject(false);
  public performingSecondaryAction$ = new BehaviorSubject(false);

  public tabs$: Observable<DashboardTab[]>;
  public dashboardData$: Observable<DashboardData>;
  public buttonsData$: Observable<ButtonsData>;

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    this.dashboardData$ = this.subscribeDashboardData$();
    this.buttonsData$ = this.subscribeButtonsData$();
    this.tabs$ = this.subscribeTabs$();

    this.subscribeInitialSelectedView();
  }

  private subscribeInitialSelectedView() {
    this.subscriptions.add(
      this.store$
        .pipe(select(selectDefaultSearchPerspectiveDashboardViewId))
        .pipe(
          startWith(undefined),
          pairwise(),
          distinctUntilChanged(([previousViewId, currentViewId]) => previousViewId === currentViewId)
        )
        .subscribe(([previousViewId, currentViewId]) => {
          if (currentViewId && (!previousViewId || previousViewId === this.selectedViewId$.value))
            this.selectedViewId$.next(currentViewId);
        })
    );
  }

  private subscribeTabs$(): Observable<DashboardTab[]> {
    return this.selectedViewId$.pipe(
      startWith(undefined),
      pairwise(),
      distinctUntilChanged(),
      switchMap(([, viewId]) => this.store$.pipe(select(selectViewById(viewId)), take(1))),
      withLatestFrom(this.defaultConfig$),
      switchMap(([selectedView, defaultConfig]) =>
        this.store$.pipe(select(selectSearchPerspectiveTabsByView(selectedView, defaultConfig)), take(1))
      )
    );
  }

  private subscribeButtonsData$(): Observable<ButtonsData> {
    return this.dashboardData$.pipe(
      map(data => {
        const showSaveButton = !data.selectedView && data.currentViewPermissions?.roles?.PerspectiveConfig;

        const selectedViewIsDifferent =
          data.selectedView && (!data.userDashboardView || data.userDashboardView.id !== data.selectedView.id);
        const canSetCurrentViewAsHome =
          data.currentView && (!data.userDashboardView || data.userDashboardView.id !== data.currentView.id);

        const showSetButton = selectedViewIsDifferent || canSetCurrentViewAsHome;
        return {showSaveButton, showSetButton};
      })
    );
  }

  private subscribeDashboardData$(): Observable<DashboardData> {
    return this.store$.pipe(
      select(selectCurrentView),
      switchMap(view => {
        if (isViewValidForDashboard(view)) {
          return this.subscribeDashboardDataByView(view);
        }
        return this.subscribeDashboardDataByDefault();
      })
    );
  }

  private subscribeDashboardDataByDefault(): Observable<DashboardData> {
    return combineLatest([
      this.subscribeSelectedView$(),
      this.subscribeUserDashboardView$(),
      this.subscribeDashboardViews$(),
    ]).pipe(
      map(([selectedView, userDashboardView, dashboardViews]) => ({
        selectedView,
        userDashboardView,
        dashboardViews,
        currentViewPermissions: completeAllowedPermissions,
      }))
    );
  }

  private subscribeDashboardDataByView(view: View): Observable<DashboardData> {
    return combineLatest([
      this.subscribeUserDashboardView$(),
      this.store$.pipe(select(selectViewPermissions(view.id))),
    ]).pipe(
      map(([userDashboardView, permissions]) => ({
        userDashboardView,
        currentView: view,
        currentViewPermissions: permissions,
      }))
    );
  }

  private subscribeDashboardViews$(): Observable<View[]> {
    return this.store$.pipe(
      select(selectViewsByReadWithComputedData),
      map(views => views.filter(view => isViewValidForDashboard(view)))
    );
  }

  private subscribeSelectedView$(): Observable<View> {
    return this.selectedViewId$.pipe(
      switchMap(viewId => (viewId ? this.store$.pipe(select(selectViewById(viewId))) : of(undefined)))
    );
  }

  private subscribeUserDashboardView$(): Observable<View> {
    return this.store$.pipe(select(selectDefaultSearchPerspectiveDashboardViewId)).pipe(
      distinctUntilChanged(),
      switchMap(viewId => (viewId ? this.store$.pipe(select(selectViewById(viewId))) : of(undefined))),
      map(view => (isViewValidForDashboard(view) ? view : null))
    );
  }

  public onCopy(data: DashboardData) {
    if (data.selectedView) {
      this.defaultConfig$.next(data.selectedView?.config?.search);
      this.selectedViewId$.next(null);
    }
  }

  public onSubmit(buttonsData: ButtonsData, dashboardData: DashboardData) {
    if (buttonsData.showSaveButton) {
      // save config
      const tabs = this.assignTabsIds(this.content.tabs$.value);
      this.submitViewDashboard(tabs);
      if (this.perspectiveId === DEFAULT_PERSPECTIVE_ID) {
        this.performingAction$.next(true);
        this.submitDefaultDashboard({tabs});
      } else {
        this.hideDialog();
      }
    } else {
      // set as home screen
      const viewId = (dashboardData.selectedView || dashboardData.currentView)?.id;
      if (viewId) {
        this.performingAction$.next(true);
        this.submitDefaultDashboard({viewId});
      }
    }
  }

  public onSecondarySubmit(dashboardData: DashboardData) {
    const viewId = (dashboardData.selectedView || dashboardData.currentView)?.id;
    if (viewId) {
      this.performingSecondaryAction$.next(true);
      this.submitDefaultDashboard({viewId});
    }
  }

  private submitDefaultDashboard(dashboard: Dashboard) {
    this.store$.dispatch(
      new ViewsAction.SetDashboard({
        dashboard,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.stopPerforming(),
      })
    );
  }

  private stopPerforming() {
    this.performingAction$.next(false);
    this.performingSecondaryAction$.next(false);
  }

  private submitViewDashboard(tabs: DashboardTab[]) {
    this.store$.pipe(select(selectSearchConfigById(this.perspectiveId)), take(1)).subscribe(config => {
      const newConfig: SearchConfig = {...config, dashboard: {tabs}};
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.perspectiveId, config: newConfig}));
    });
  }

  private assignTabsIds(tabs: DashboardTab[]): DashboardTab[] {
    const tabIds = new Set<string>();
    const assignedTabs: DashboardTab[] = [];
    for (const tab of tabs) {
      if (tab.id) {
        tabIds.add(tab.id);
        assignedTabs.push(tab);
      } else {
        const newId = createDashboardTabId(tab.title, tabIds);
        tabIds.add(newId);
        assignedTabs.push({...tab, id: newId, correlationId: undefined});
      }
    }
    return assignedTabs;
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

interface DashboardData {
  selectedView?: View;
  userDashboardView: View;
  currentViewPermissions: AllowedPermissions;
  currentView?: View;
  dashboardViews?: View[];
}

interface ButtonsData {
  showSaveButton: boolean;
  showSetButton: boolean;
}
