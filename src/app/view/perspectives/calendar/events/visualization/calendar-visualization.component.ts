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
import {
  CALENDAR_DATE_FORMAT,
  CALENDAR_TIME_FORMAT,
  CalendarMode,
} from '../../../../../core/store/calendars/calendar.model';
import {CalendarEvent, CalendarEventTimesChangedEvent} from 'angular-calendar';
import {Subject} from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'calendar-visualization',
  templateUrl: './calendar-visualization.component.html',
  styleUrls: ['./calendar-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarVisualizationComponent implements OnChanges {
  @Input()
  public events: CalendarEvent[];

  @Input()
  public currentMode: CalendarMode;

  @Input()
  public currentDate: Date;

  @Output()
  public timesChange = new EventEmitter<{documentId: string; changes: {attributeId: string; value: any}[]}>();

  public readonly calendarMode = CalendarMode;

  public refresh: Subject<any> = new Subject();

  constructor(@Inject(LOCALE_ID) private locale: string) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.events) {
      this.visualize();
    }
  }

  private visualize() {
    this.refresh.next();
  }

  public dayClicked({date, events}: {date: Date; events: CalendarEvent[]}): void {
    // TODO
  }

  public eventTimesChanged({event, newStart, newEnd}: CalendarEventTimesChangedEvent): void {
    event.start = newStart;
    event.end = newEnd;
    this.refresh.next();

    this.onDocumentTimesChange(event);
  }

  private onDocumentTimesChange(event: CalendarEvent) {
    const {startAttributeId, endAttributeId, startTimeAttributeId, endTimeAttributeId} = event.meta;

    const changes = [];

    startAttributeId && changes.push({attributeId: startAttributeId, value: this.dateToString(event.start)});
    endAttributeId && changes.push({attributeId: endAttributeId, value: this.dateToString(event.end)});
    startTimeAttributeId && changes.push({attributeId: startTimeAttributeId, value: this.timeToString(event.start)});
    endTimeAttributeId && changes.push({attributeId: endTimeAttributeId, value: this.timeToString(event.end)});

    if (changes.length) {
      this.timesChange.emit({documentId: event.meta.documentId, changes});
    }
  }

  private dateToString(date: Date): string {
    return moment(date).format(CALENDAR_DATE_FORMAT);
  }

  private timeToString(date: Date): string {
    return moment(date).format(CALENDAR_TIME_FORMAT);
  }
}
