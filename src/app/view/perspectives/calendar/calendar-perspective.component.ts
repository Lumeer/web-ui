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

import {ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
// import {selectPerspectiveViewConfig} from '../../../core/store/views/views.state';
import {map, take} from 'rxjs/operators';
import {ViewModel} from '../../../core/store/views/view.model';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AppState} from '../../../core/store/app.state';
import {selectCalendarConfig} from '../../../core/store/calendar/calendar.state';
import {CalendarConfig, DEFAULT_CALENDAR_ID} from '../../../core/store/calendar/calendar.model';
import {CalendarAction} from '../../../core/store/calendar/calendar.action';


@Component({
  selector: 'calendar',
  templateUrl: './calendar-perspective.component.html',
  styleUrls: ['./calendar-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPerspectiveComponent implements OnInit, OnDestroy {
  @Input()
  public query: QueryModel;


  public documents$: Observable<DocumentModel[]>;
  public collection$: Observable<CollectionModel>;
  public config$: Observable<CalendarConfig>;
  public currentView$: Observable<ViewModel>;

  public query$ = new BehaviorSubject<QueryModel>(null);

  private subscriptions = new Subscription();
  private calendarId = DEFAULT_CALENDAR_ID;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.initCalendar();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchDocuments(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: QueryModel) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private initCalendar() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        take(1)
      )
      .subscribe(view => {
        const config = (view && view.config && view.config.calendar) || this.createDefaultConfig();
        const calendar = {id: this.calendarId, config};
        this.store$.dispatch(new CalendarAction.AddCalendar({calendar}));
      });
    this.subscriptions.add(subscription);
  }

  private subscribeData() {
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.collection$ = this.store$.pipe(
      select(selectCollectionsByQuery),
      map(collections => collections[0])
    );
    this.config$ = this.store$.pipe(select(selectCalendarConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
  }

  private createDefaultConfig(): CalendarConfig {
    return {barsProperties: {}};
  }

  public onConfigChanged(config: CalendarConfig) {
    this.store$.dispatch(new CalendarAction.SetConfig({calendarId: this.calendarId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new CalendarAction.RemoveCalendar({calendarId: this.calendarId}));
  }

}
