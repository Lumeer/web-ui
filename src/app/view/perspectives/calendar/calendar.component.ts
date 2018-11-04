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
import {MatDialog, MatDialogConfig} from "@angular/material";
import eventsExample from './data';


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

  events: CalendarEvent[] = eventsExample;

  activeDayIsOpen: boolean = true;

  constructor(private store$: Store<{}>, private dialog: MatDialog) {}

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      this.viewDate = date;
      this.activeDayIsOpen = !((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0);
    }
  //   console.log("clicked",date);
  // }
  //
  // openDialog() {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      id: 1,
      title: 'Angular For Beginners'
    };

    this.dialog.open(CourseDialogComponent, dialogConfig);
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


  addEvent(date: Date): void {
    this.events.push({
      start: date,
      title: 'New event',
      color: colors.red
    });
    this.refresh.next();
  }

  @Input()
  public query: QueryModel;

  public collections$: Observable<CollectionModel[]>;
  public documents$: Observable<DocumentModel[]>;
  //public calendar$: Observable<MapModel>;
  public validQuery$: Observable<boolean>;
  //private calendarId = DEFAULT_CALENDAR_ID;     //TODO

  private subscriptions = new Subscription();

  public ngOnInit() {
    this.bindValidQuery();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    //this.bindCalendar(this.calendarId);
  }

  private bindValidQuery() {
    this.validQuery$ = this.store$.pipe(
      select(selectQuery),
      map(query => query && query.collectionIds && query.collectionIds.length > 0)
    );
  }


}

import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'course-dialog',
  templateUrl: './dialog-overview-example-dialog.html',
  styleUrls: ['./calendar.component.scss']
})
export class CourseDialogComponent implements OnInit {


  description:string;

  constructor(
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data) {

    this.description = data.description;
  }

  ngOnInit() {
    this.description = 'ahoj';
  }

  save() {
    this.dialogRef.close();
  }

  close() {
    this.dialogRef.close();
  }
}
