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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {
  selectCollectionsByCustomQuery,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {Collection} from '../../../core/store/collections/collection';
import {distinctUntilChanged, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {View, ViewConfig} from '../../../core/store/views/view';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AppState} from '../../../core/store/app.state';
import {selectCalendarById, selectCalendarConfig} from '../../../core/store/calendars/calendars.state';
import {CalendarConfig, CalendarMode, DEFAULT_CALENDAR_ID} from '../../../core/store/calendars/calendar.model';
import {CalendarsAction} from '../../../core/store/calendars/calendars.action';
import {Query} from '../../../core/store/navigation/query';
import {queryWithoutLinks} from '../../../core/store/navigation/query.util';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionsPermissionsPipe} from '../../../shared/pipes/permissions/collections-permissions.pipe';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {DialogService} from '../../../dialog/dialog.service';

@Component({
  selector: 'calendar',
  templateUrl: './calendar-perspective.component.html',
  styleUrls: ['./calendar-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPerspectiveComponent implements OnInit, OnDestroy {
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public config$: Observable<CalendarConfig>;
  public currentView$: Observable<View>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;

  public query$ = new BehaviorSubject<Query>(null);

  private subscriptions = new Subscription();
  private calendarId = DEFAULT_CALENDAR_ID;

  constructor(
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe,
    private dialogService: DialogService
  ) {}

  public ngOnInit() {
    this.initCalendar();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private initCalendar() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectCalendarById(this.calendarId))))
      )
      .subscribe(([view, calendar]) => {
        if (calendar) {
          this.refreshCalendar(view && view.config);
        } else {
          this.createCalendar(view && view.config);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshCalendar(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.calendar) {
      this.store$.dispatch(new CalendarsAction.SetConfig({calendarId: this.calendarId, config: viewConfig.calendar}));
    }
  }

  private createCalendar(viewConfig: ViewConfig) {
    const config = (viewConfig && viewConfig.calendar) || this.createDefaultConfig();
    const calendar = {id: this.calendarId, config};
    this.store$.dispatch(new CalendarsAction.AddCalendar({calendar}));
  }

  private createDefaultConfig(): CalendarConfig {
    return {collections: {}, date: new Date(), mode: CalendarMode.Month};
  }

  private subscribeToQuery() {
    const subscription = this.store$
      .pipe(
        select(selectQuery),
        map(query => query && queryWithoutLinks(query))
      )
      .subscribe(query => {
        this.query$.next(query);
        this.fetchDocuments(query);
        this.documents$ = this.store$.pipe(select(selectDocumentsByCustomQuery(query)));
        this.collections$ = this.store$.pipe(select(selectCollectionsByCustomQuery(query)));
        this.permissions$ = this.collections$.pipe(
          mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
          distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
        );
      });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private subscribeData() {
    this.config$ = this.store$.pipe(select(selectCalendarConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
  }

  public onConfigChanged(config: CalendarConfig) {
    this.store$.dispatch(new CalendarsAction.SetConfig({calendarId: this.calendarId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new CalendarsAction.RemoveCalendar({calendarId: this.calendarId}));
  }

  public onNewEvent(time: number) {
    this.dialogService.openCreateCalendarEventDialog(this.calendarId, time);
  }
}
