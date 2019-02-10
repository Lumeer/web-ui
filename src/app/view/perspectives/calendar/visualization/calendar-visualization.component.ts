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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  CALENDAR_DATE_FORMAT,
  CALENDAR_TIME_FORMAT,
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
  CalendarMode,
} from '../../../../core/store/calendars/calendar.model';
import {CalendarEvent, CalendarEventTimesChangedEvent} from 'angular-calendar';
import {BehaviorSubject, Subject} from 'rxjs';
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

  @Input()
  public canManageConfig: boolean;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @Output()
  public configChange = new EventEmitter<CalendarConfig>();

  public currentMode$ = new BehaviorSubject<CalendarMode>(CalendarMode.Month);
  public currentDate$ = new BehaviorSubject<Date>(new Date());

  public readonly calendarMode = CalendarMode;

  public refresh: Subject<any> = new Subject();

  public events: CalendarEvent[] = [];
  public shownEvents: CalendarEvent[] = [];

  constructor(@Inject(LOCALE_ID) private locale: string) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config || changes.collections) && this.config) {
      this.visualize();
    }
    if (changes.config && this.config) {
      this.currentMode$.next(this.config.mode);
      this.currentDate$.next(this.config.date);
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
        start = start.hour(startTimeChunks[0]).minute(startTimeChunks[1]);
      }

      if (endTimeChunks) {
        end = end.hour(endTimeChunks[0]).minute(endTimeChunks[1]);
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
    const chunks = (time || '').split(/[:.]/g, 2);
    if (chunks.length !== 2) {
      return null;
    }

    const timeChunks = [+chunks[0], +chunks[1]].filter(num => isNumeric(num));
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
    this.onViewDateChange(date);
  }

  public eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();

    this.onDocumentTimesChange(event);
  }

  private onDocumentTimesChange(event: CalendarEvent) {
    const originalDocument = this.documents.find(document => document.id === event.meta.documentId);
    if (!originalDocument) {
      return;
    }

    const patchDocument = {...originalDocument};

    const collectionConfig = this.config.collections[originalDocument.collectionId] || {};
    const properties = collectionConfig.barsProperties || {};

    const startProperty = properties[CalendarBarPropertyRequired.START_DATE];
    const endProperty = properties[CalendarBarPropertyRequired.END_DATE];
    const startTimeProperty = properties[CalendarBarPropertyOptional.START_TIME];
    const endTimeProperty = properties[CalendarBarPropertyOptional.END_TIME];

    startProperty && (patchDocument.data[startProperty.attributeId] = this.dateToString(event.start));
    endProperty && (patchDocument.data[endProperty.attributeId] = this.dateToString(event.end));
    startTimeProperty && (patchDocument.data[startTimeProperty.attributeId] = this.timeToString(event.start));
    endTimeProperty && (patchDocument.data[endTimeProperty.attributeId] = this.timeToString(event.end));

    this.patchData.emit(patchDocument);
  }

  private dateToString(date: Date) {
    return moment(date).format(CALENDAR_DATE_FORMAT);
  }

  private timeToString(date: Date) {
    return moment(date).format(CALENDAR_TIME_FORMAT);
  }

  public onModeChange(mode: CalendarMode) {
    if (this.canManageConfig) {
      const config = {...this.config, mode};
      this.configChange.next(config);
    } else {
      this.currentMode$.next(mode);
    }
  }

  public onViewDateChange(date: Date) {
    if (this.canManageConfig) {
      const config = {...this.config, date};
      this.configChange.next(config);
    } else {
      this.currentDate$.next(date);
    }
  }
}
