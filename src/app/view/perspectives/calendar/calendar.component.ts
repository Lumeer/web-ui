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

import {ChangeDetectionStrategy, Component, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, Subject, Subscription} from 'rxjs';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
// import {selectPerspectiveViewConfig} from '../../../core/store/views/views.state';
//import {DEFAULT_MAP_ID, selectMapById} from "../../../core/store/maps/maps.state";
import {map} from 'rxjs/operators';
import {colors} from "./utils/colors";
import {setHours, setMinutes, isSameMonth, isSameDay, startOfDay, endOfDay, addHours, addDays, endOfMonth, subDays} from 'date-fns';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView
} from 'angular-calendar';
// import eventsExample from './utils/data';
import {ViewModel} from "../../../core/store/views/view.model";
import {selectCurrentView} from "../../../core/store/views/views.state";


@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit {

  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  actions: CalendarEventAction[] = [];

  refresh: Subject<any> = new Subject();

  events: CalendarEvent[] = [];
  shownEvents: CalendarEvent[] = [];


  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    this.shownEvents = events;
    this.viewDate = date;
  }


  eventTimesChanged({
                      event,
                      newStart,
                      newEnd
                    }: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();
  }


  // addEvent(date: Date): void {
  //   this.events.push({
  //     start: date,
  //     title: 'New event',
  //     color: colors.red
  //   });
  //   this.refresh.next();
  // }

  @Input()
  public query: QueryModel;

  public currentView$: Observable<ViewModel>;
  public collections$: Observable<CollectionModel[]>;
  public documents$: Observable<DocumentModel[]>;
  //public calendar$: Observable<MapModel>;
  public validQuery$: Observable<boolean>;
  //private calendarId = DEFAULT_CALENDAR_ID;     //TODO

  // private subscriptions = new Subscription();

  constructor(private store$: Store<{}>) {}

  public ngOnInit() {
    this.bindValidQuery();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    //this.bindCalendar(this.calendarId);
    this.currentView$ = this.store$.select(selectCurrentView);
    this.showCalendar();
  }

  private bindValidQuery() {
    this.validQuery$ = this.store$.pipe(
      select(selectQuery),
      map(query => query && query.collectionIds && query.collectionIds.length > 0)
    );
  }

  private showCalendar() {
    this.documents$.subscribe(documents => {
      documents.forEach(document => {
        console.log(document);
        if(this.validateDataInRow(document.data)){
          this.events.push(this.createEvent(document.data));
        }
      });
    });
  }

  private validateDataInRow (data){
    let values = Object.values(data);
    let isString: boolean = false;
    let isDate: boolean = false;
    values.forEach(column => {
      if(!isDate){
        isDate=CalendarComponent.isValidDate(column);
      }
      if(!isString) {
        isString = typeof column === "string";
      }
    });
    return isString && isDate;

  }

  private createEvent(doc: Object){
    let values = Object.values(doc);
    let date: Date = new Date();
    let name: string = '';
    values.forEach(column => {
        if(CalendarComponent.isValidDate(column)) {
          date = CalendarComponent.createDate(column);
        }
        else if (typeof column === "string" && name == '') {
          name = column;
        }
    });
    return{
      start: date,
      title: name,
      color: colors.red,
      allDay: true
    };
  }

  private static createDate(dateString){
    let separators = ['\\.', '\\-', '\\/'];
    let bits = dateString.split(new RegExp(separators.join('|'), 'g'));
    return new Date(bits[2], bits[1] - 1, bits[0]);
  }

  //expected input dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  private static isValidDate(string) {
    let separators = ['\\.', '\\-', '\\/'];
    let bits = string.split(new RegExp(separators.join('|'), 'g'));
    let date = new Date(bits[2], bits[1] - 1, bits[0]);
    return date.getFullYear() == bits[2] && date.getMonth() + 1 == bits[1];
  }

}
