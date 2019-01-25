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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, SimpleChanges, OnChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
} from '../../../../core/store/calendars/calendar.model';
import {CalendarEvent, CalendarEventTimesChangedEvent, CalendarView} from 'angular-calendar';
import {Subject} from 'rxjs';
import * as moment from 'moment';
import {isNumeric} from '../../../../shared/utils/common.utils';
import {shadeColor} from '../../../../shared/utils/html-modifier';

@Component({
  selector: 'calendar-visualization',
  templateUrl: './calendar-visualization.component.html',
  styleUrls: ['./calendar-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarVisualizationComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: CalendarConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public readonly calendarView = CalendarView;

  public view: CalendarView = CalendarView.Month;

  public viewDate: Date = new Date();

  public refresh: Subject<any> = new Subject();

  public events: CalendarEvent[] = [];
  public shownEvents: CalendarEvent[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config || changes.collections) && this.config) {
      this.visualize();
    }
  }

  private visualize() {
    this.events = this.createEvents();
    this.refresh.next();
  }

  private createEvents(): CalendarEvent[] {
    const events = [];
    for (const document of this.documents) {
      const collectionConfig = this.config.collections[document.collectionId] || {};
      const properties = collectionConfig.barsProperties || {};

      const nameProperty = properties[CalendarBarPropertyRequired.NAME];
      const startProperty = properties[CalendarBarPropertyRequired.START_DATE];
      const endProperty = properties[CalendarBarPropertyRequired.END_DATE];
      const startTimeProperty = properties[CalendarBarPropertyOptional.START_TIME];
      const endTimeProperty = properties[CalendarBarPropertyOptional.END_TIME];

      const title = nameProperty && document.data[nameProperty.attributeId];
      const startString = startProperty && document.data[startProperty.attributeId];
      const endString = endProperty && document.data[endProperty.attributeId];

      if (!this.isEventValid(title, startString, endString)) {
        continue;
      }

      let start = moment(startString);
      let end = moment(endString);
      if (!start.isValid()) {
        start = end;
      } else if (!end.isValid()) {
        end = start;
      }

      const startTimeString = startTimeProperty && document.data[startTimeProperty.attributeId];
      const endTimeString = endTimeProperty && document.data[endTimeProperty.attributeId];

      const startTimeChunks = this.parseTime(startTimeString);
      const endTimeChunks = this.parseTime(endTimeString);

      if (startTimeChunks) {
        start.hours(startTimeChunks[0]);
        start.minutes(startTimeChunks[1]);
      }

      if (endTimeChunks) {
        end.hours(endTimeChunks[0]);
        end.minutes(endTimeChunks[1]);
      }

      const allDay = this.isAllDayEvent(start.toDate(), end.toDate());
      const collection = this.collections.find(coll => coll.id === document.collectionId);

      const event = {
        title,
        start: start.toDate(),
        end: end.toDate(),
        color: this.getColor(allDay, collection.color),
        allDay,
        draggable: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
        meta: {
          documentId: document.id,
          collectionId: document.collectionId,
        },
      };

      events.push(event);
    }

    return events;
  }

  private isEventValid(title: string, startString: string, endString: string): boolean {
    return title && (moment(startString).isValid() || moment(endString).isValid());
  }

  //expected input hh:mm or hh.mm
  private parseTime(time: string): [number, number] {
    const separators = ['\\:', '\\.'];
    const chunks = (time || '').split(new RegExp(separators.join('|'), 'g'), 2);
    if (chunks.length !== 2) {
      return null;
    }

    const timeChunks = [+chunks[1], +chunks[2]].filter(num => isNumeric(num));
    if (timeChunks.length !== 2) {
      return null;
    }

    return timeChunks as [number, number];
  }

  private isAllDayEvent(start: Date, end: Date): boolean {
    return start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;
  }

  private getColor(allDay: boolean, color: string) {
    if (allDay) {
      return {
        primary: color,
        secondary: shadeColor(color, 90),
      };
    }
    return {
      primary: shadeColor(color, 70),
      secondary: shadeColor(color, 60),
    };
  }

  public dayClicked({date, events}: {date: Date; events: CalendarEvent[]}): void {
    this.shownEvents = events;
    this.viewDate = date;
  }

  public eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.decomposeEvent(event);
    this.refresh.next();
  }

  public decomposeEvent(event) {
    // const originalDocument = this.documents.find(document => document.id === event.meta.documentId);
    // const configOfCollection = this.allConfigs.find(config => config.id === event.meta.collectionId);
    // originalDocument.data[configOfCollection.barsProperties[CalendarBarPropertyRequired.NAME].attributeId] =
    //   event.title;
    // originalDocument.data[
    //   configOfCollection.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId
    //   ] = CalendarVisualizationComponent.dateToString(event.start);
    // originalDocument.data[
    //   configOfCollection.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId
    //   ] = CalendarVisualizationComponent.dateToString(event.end);
    // //optional
    // if (
    //   configOfCollection.barsProperties[CalendarBarPropertyOptional.START_TIME] &&
    //   configOfCollection.barsProperties[CalendarBarPropertyOptional.END_TIME]
    // ) {
    //   originalDocument.data[
    //     configOfCollection.barsProperties[CalendarBarPropertyOptional.START_TIME].attributeId
    //     ] = CalendarVisualizationComponent.timeToString(event.start);
    //   originalDocument.data[
    //     configOfCollection.barsProperties[CalendarBarPropertyOptional.END_TIME].attributeId
    //     ] = CalendarVisualizationComponent.timeToString(event.end);
    // }
    // this.patchData.emit(originalDocument);
  }

  public static dateToString(date: Date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
  }

  public static timeToString(date: Date) {
    return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
  }
}
