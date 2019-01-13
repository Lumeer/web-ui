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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  ViewEncapsulation,
} from '@angular/core';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
} from '../../../../core/store/calendar/calendar.model';
import {CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarView} from 'angular-calendar';
import {Subject} from 'rxjs';
import {
  setHours,
  setMinutes,
  isSameMonth,
  isSameDay,
  startOfDay,
  endOfDay,
  addHours,
  addDays,
  endOfMonth,
  subDays,
} from 'date-fns';

@Component({
  selector: 'calendar-visualization',
  templateUrl: './calendar-visualization.component.html',
  styleUrls: ['./calendar-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarVisualizationComponent implements OnChanges {
  @Input()
  public collections: CollectionModel[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public allConfigs: CalendarConfig[];

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public view: CalendarView = CalendarView.Month;

  public CalendarView = CalendarView;

  public viewDate: Date = new Date();

  public actions: CalendarEventAction[] = [];

  public refresh: Subject<any> = new Subject();

  public events: CalendarEvent[] = [];
  public shownEvents: CalendarEvent[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.allConfigs || changes.collections) && this.allConfigs) {
      this.visualize();
    }
  }

  private visualize() {
    this.events = [];
    this.allConfigs.forEach(config => {
      if (
        config.barsProperties[CalendarBarPropertyRequired.NAME] &&
        config.barsProperties[CalendarBarPropertyRequired.START_DATE] &&
        config.barsProperties[CalendarBarPropertyRequired.END_DATE]
      ) {
        this.documents
          .filter(doc => doc.collectionId === config.id)
          .forEach(document => {
            if (
              CalendarVisualizationComponent.isValidDate(
                document.data[config.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId]
              ) ||
              CalendarVisualizationComponent.isValidDate(
                document.data[config.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId]
              )
            ) {
              this.events.push(this.createEvent(document, 'No title', undefined, undefined, config));
            }
          });
      }
    });
    this.refresh.next();
  }

  private createEvent(document, title, start, end, config) {
    const titleFromDocument = document.data[config.barsProperties[CalendarBarPropertyRequired.NAME].attributeId];
    const startFromDocument = document.data[config.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId];
    const endFromDocument = document.data[config.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId];

    if (titleFromDocument !== '') title = titleFromDocument;

    if (CalendarVisualizationComponent.isValidDate(startFromDocument)) {
      start = CalendarVisualizationComponent.createDate(startFromDocument);
    } else start = CalendarVisualizationComponent.createDate(endFromDocument);

    if (CalendarVisualizationComponent.isValidDate(endFromDocument)) {
      end = CalendarVisualizationComponent.createDate(endFromDocument);
    } else end = CalendarVisualizationComponent.createDate(startFromDocument);

    //optional
    if (
      config.barsProperties[CalendarBarPropertyOptional.START_TIME] &&
      config.barsProperties[CalendarBarPropertyOptional.END_TIME]
    ) {
      const startTime = document.data[config.barsProperties[CalendarBarPropertyOptional.START_TIME].attributeId];
      if (CalendarVisualizationComponent.isValidTime(startTime) && typeof startTime !== 'undefined') {
        const startTimeArray = CalendarVisualizationComponent.createTime(startTime);
        start.setHours(startTimeArray[0]);
        start.setMinutes(startTimeArray[1]);
      } else if (CalendarVisualizationComponent.isValidTime(startTime) && typeof startTime === 'undefined') {
        start.setHours(0);
        start.setMinutes(0);
      }
      const endTime = document.data[config.barsProperties[CalendarBarPropertyOptional.END_TIME].attributeId];
      if (CalendarVisualizationComponent.isValidTime(endTime) && typeof endTime !== 'undefined') {
        const endTimeArray = CalendarVisualizationComponent.createTime(endTime);
        end.setHours(endTimeArray[0]);
        end.setMinutes(endTimeArray[1]);
      } else if (CalendarVisualizationComponent.isValidTime(endTime) && typeof endTime === 'undefined') {
        end.setHours(23);
        end.setMinutes(59);
      }
    }

    return {
      title: title,
      start: start,
      end: end,
      color: CalendarVisualizationComponent.getColor(
        true,
        this.collections.find(collection => collection.id === config.id).color
      ),
      allDay: false,
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
  }

  private static createDate(dateString) {
    const separators = ['\\.', '\\-', '\\/'];
    const bits = dateString.split(new RegExp(separators.join('|'), 'g'));
    return new Date(bits[2], bits[1] - 1, bits[0]);
  }

  private static createTime(dateString) {
    const separators = ['\\:', '\\.'];
    return dateString.split(new RegExp(separators.join('|'), 'g'));
  }

  //expected input hh:mm or hh.mm
  private static isValidTime(timeString) {
    if (timeString !== undefined) {
      const separators = ['\\:', '\\.'];
      const bits = timeString.split(new RegExp(separators.join('|'), 'g'));
      const date = new Date();
      date.setHours(bits[0]);
      date.setMinutes(bits[1]);
      const minutesToCompare = date.getMinutes().toString() === '0' ? '00' : date.getMinutes().toString();
      return date.getHours().toString() === bits[0] && minutesToCompare === bits[1];
    } else return false;
  }

  //expected input dd/mm/yyyy or dd.mm.yyyy or dd-mm-yyyy
  private static isValidDate(dateString) {
    if (dateString === undefined || dateString === null) return false;
    const separators = ['\\.', '\\-', '\\/'];
    const bits = dateString.split(new RegExp(separators.join('|'), 'g'));
    const date = new Date(bits[2], bits[1] - 1, bits[0]);
    return date.getFullYear().toString() === bits[2] && (date.getMonth() + 1).toString() === bits[1];
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

  public static dateToString(date: Date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
  }

  public static timeToString(date: Date) {
    return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
  }

  public decomposeEvent(event) {
    const originalDocument = this.documents.find(document => document.id === event.meta.documentId);
    const configOfCollection = this.allConfigs.find(config => config.id === event.meta.collectionId);
    originalDocument.data[configOfCollection.barsProperties[CalendarBarPropertyRequired.NAME].attributeId] =
      event.title;
    originalDocument.data[
      configOfCollection.barsProperties[CalendarBarPropertyRequired.START_DATE].attributeId
    ] = CalendarVisualizationComponent.dateToString(event.start);
    originalDocument.data[
      configOfCollection.barsProperties[CalendarBarPropertyRequired.END_DATE].attributeId
    ] = CalendarVisualizationComponent.dateToString(event.end);
    originalDocument.data[
      configOfCollection.barsProperties[CalendarBarPropertyOptional.START_TIME].attributeId
    ] = CalendarVisualizationComponent.timeToString(event.start);
    originalDocument.data[
      configOfCollection.barsProperties[CalendarBarPropertyOptional.END_TIME].attributeId
    ] = CalendarVisualizationComponent.timeToString(event.end);
    this.patchData.emit(originalDocument);
  }

  private static getColor(allDay: boolean, color: string) {
    if (allDay)
      return {
        primary: color,
        secondary: CalendarVisualizationComponent.LightenDarkenColor(color, 100),
      };
    else
      return {
        primary: CalendarVisualizationComponent.LightenDarkenColor(color, -100),
        secondary: CalendarVisualizationComponent.LightenDarkenColor(color, 70),
      };
  }

  private static LightenDarkenColor(color: string, amt: number) {
    let usePound = false;

    if (color[0] === '#') {
      color = color.slice(1);
      usePound = true;
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00ff) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000ff) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
  }
}
