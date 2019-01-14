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
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {take} from 'rxjs/operators';
import {ViewModel} from '../../../core/store/views/view.model';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {AppState} from '../../../core/store/app.state';
import {selectCalendarConfig} from '../../../core/store/calendar/calendar.state';
import {CalendarConfig, DEFAULT_CALENDAR_ID} from '../../../core/store/calendar/calendar.model';
import {CalendarAction} from '../../../core/store/calendar/calendar.action';
import {Query} from '../../../core/store/navigation/query';

@Component({
  selector: 'calendar',
  templateUrl: './calendar-perspective.component.html',
  styleUrls: ['./calendar-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPerspectiveComponent implements OnInit, OnDestroy {
  public documents$: DocumentModel[];
  public collections$: CollectionModel[];
  public config$: CalendarConfig[];
  public currentView$: Observable<ViewModel>;

  public query$ = new BehaviorSubject<Query>(null);

  private subscriptions = new Subscription();
  private calendarId = DEFAULT_CALENDAR_ID;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.initCalendar();
    this.subscribeToQuery();
    this.subscribeData();
    if(this.config$.length === 1 && this.config$[0].id === 'default')
      this.initConfig();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchDocuments(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private initCalendar() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        take(1)
      )
      .subscribe(view => {
        const config = (view && view.config && view.config.calendar) || CalendarPerspectiveComponent.createDefaultConfig();
        const calendar = {id: this.calendarId, config};
        this.store$.dispatch(new CalendarAction.AddCalendar({calendar}));
      });
    this.subscriptions.add(subscription);
  }

  private subscribeData() {
    const subscribeDocuments = this.store$
      .pipe(select(selectDocumentsByQuery))
      .subscribe(documents => this.documents$ = documents);
    const subscribeCollections = this.store$
      .pipe(select(selectCollectionsByQuery))
      .subscribe(collections => {
        this.collections$ = collections;
        this.updateConfigs()
      });
    const subscribeConfigs = this.store$
      .pipe(select(selectCalendarConfig))
      .subscribe(configs => this.config$ = configs);
    this.subscriptions.add(subscribeDocuments);
    this.subscriptions.add(subscribeCollections);
    this.subscriptions.add(subscribeConfigs);
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
  }

  private static createDefaultConfig(): CalendarConfig[] {
    return [{
      id: "default",
      barsProperties: {}
    }];
  }

  private initConfig () {
    const newConfig: CalendarConfig[] = [];
    this.collections$.forEach(collection => {
              newConfig.push({
                id: collection.id,
                barsProperties: {}
              });
    });
    this.onConfigChanged(newConfig);
  };

  private updateConfigs(){
    this.collections$.forEach(collection => {
      if(this.config$ !== undefined) {
        if (this.config$.find(existingConfig => existingConfig.id === collection.id) === undefined) {
          this.onConfigChanged([...this.config$, {
            id: collection.id,
            barsProperties: {}
          }]);
        }
      }
    });
  }

  public onConfigChanged(config: CalendarConfig[]) {
    this.store$.dispatch(new CalendarAction.SetConfig({calendarId: this.calendarId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new CalendarAction.RemoveCalendar({calendarId: this.calendarId}));
  }

  public filter (configs: CalendarConfig[], id: string): CalendarConfig{
    return configs.find(foundConfig => foundConfig.id === id);
  }
}
