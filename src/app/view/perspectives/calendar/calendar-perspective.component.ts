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
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {
  selectCanManageViewConfig,
  selectCollectionsByQuery,
  selectDocumentsAndLinksByQuerySorted,
  selectLinkTypesInQuery,
} from '../../../core/store/common/permissions.selectors';
import {Collection} from '../../../core/store/collections/collection';
import {map, mergeMap, pairwise, startWith, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {View} from '../../../core/store/views/view';
import {selectCurrentView, selectSidebarOpened, selectViewQuery} from '../../../core/store/views/views.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AppState} from '../../../core/store/app.state';
import {selectCalendarById, selectCalendarConfig} from '../../../core/store/calendars/calendars.state';
import {CalendarConfig, DEFAULT_CALENDAR_ID} from '../../../core/store/calendars/calendar';
import {CalendarsAction} from '../../../core/store/calendars/calendars.action';
import {Query} from '../../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ViewsAction} from '../../../core/store/views/views.action';
import {ConstraintData} from '../../../core/model/data/constraint';
import {checkOrTransformCalendarConfig} from './util/calendar-util';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {StoreDataService} from '../../../core/service/store-data.service';

@Component({
  selector: 'calendar',
  templateUrl: './calendar-perspective.component.html',
  styleUrls: ['./calendar-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPerspectiveComponent implements OnInit, OnDestroy {
  public collections$: Observable<Collection[]>;
  public documents$: Observable<DocumentModel[]>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public linkTypes$: Observable<LinkType[]>;
  public config$: Observable<CalendarConfig>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);

  private calendarId: string;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private storeDataService: StoreDataService) {}

  public ngOnInit() {
    this.initCalendar();
    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  private initCalendar() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({calendarId, config}: {calendarId?: string; config?: CalendarConfig}) => {
        if (calendarId) {
          this.calendarId = calendarId;
          this.store$.dispatch(new CalendarsAction.AddCalendar({calendar: {id: calendarId, config}}));
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{calendarId?: string; config?: CalendarConfig}> {
    const calendarId = view.code;
    return this.store$.pipe(
      select(selectCalendarById(calendarId)),
      take(1),
      mergeMap(calendarEntity => {
        const calendarConfig = view.config && view.config.calendar;
        if (preferViewConfigUpdate(previousView?.config?.calendar, view?.config?.calendar, !!calendarEntity)) {
          return this.checkCalendarConfig(calendarConfig).pipe(map(config => ({calendarId, config})));
        }
        return of({calendarId, config: calendarEntity?.config || calendarConfig});
      })
    );
  }

  private checkCalendarConfig(config: CalendarConfig): Observable<CalendarConfig> {
    return combineLatest([
      this.store$.pipe(select(selectViewQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformCalendarConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{calendarId?: string; config?: CalendarConfig}> {
    const calendarId = DEFAULT_CALENDAR_ID;
    return this.store$.pipe(
      select(selectViewQuery),
      withLatestFrom(this.store$.pipe(select(selectCalendarById(calendarId)))),
      mergeMap(([, calendar]) => this.checkCalendarConfig(calendar?.config)),
      map(config => ({calendarId, config}))
    );
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectViewQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchData(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeData() {
    this.collections$ = this.storeDataService.selectCollectionsByQuery$();
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.config$ = this.store$.pipe(select(selectCalendarConfig));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public onConfigChanged(config: CalendarConfig) {
    if (this.calendarId) {
      this.store$.dispatch(new CalendarsAction.SetConfig({calendarId: this.calendarId, config}));
    }
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  private setupSidebar() {
    this.store$
      .pipe(select(selectCurrentView), withLatestFrom(this.store$.pipe(select(selectSidebarOpened))), take(1))
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }
}
