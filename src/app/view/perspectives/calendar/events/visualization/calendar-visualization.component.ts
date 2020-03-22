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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import View from '@fullcalendar/core/View';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {ButtonTextCompoundInput, ToolbarInput} from '@fullcalendar/core/types/input-types';
import {CalendarEvent, CalendarMetaData} from '../../util/calendar-event';
import {environment} from '../../../../../../environments/environment';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {CalendarMode} from '../../../../../core/store/calendars/calendar';

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
  public eventClick = new EventEmitter<CalendarEvent>();

  @Output()
  public newEvent = new EventEmitter<{start: Date; end: Date}>();

  @Output()
  public rangeChanged = new EventEmitter<{newMode: CalendarMode; newDate: Date}>();

  @Output()
  public eventRangeChanged = new EventEmitter<{metadata: CalendarMetaData; start: Date; end?: Date}>();

  @ViewChild('calendar', {static: true})
  public calendarComponent: FullCalendarComponent;

  public readonly locale = environment.locale;
  public readonly calendarPlugins = [timeGridPlugin, dayGridPlugin, interactionPlugin];
  public readonly buttonText: ButtonTextCompoundInput = {};
  public readonly calendarModesMap: Record<CalendarMode, string> = {
    [CalendarMode.Month]: 'dayGridMonth',
    [CalendarMode.Week]: 'timeGridWeek',
    [CalendarMode.Day]: 'timeGridDay',
  };
  public readonly header: ToolbarInput = {
    left: Object.values(this.calendarModesMap).join(','),
    center: 'title',
    right: 'prev,today,next',
  };

  public defaultView: string;
  public defaultDate: Date;

  constructor(private i18n: I18n) {
    this.buttonText = {
      today: i18n({id: 'perspective.calendar.header.today', value: 'Today'}),
      month: i18n({id: 'perspective.calendar.header.month', value: 'Month'}),
      week: i18n({id: 'perspective.calendar.header.week', value: 'Week'}),
      day: i18n({id: 'perspective.calendar.header.day', value: 'Day'}),
    };
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.currentMode && this.currentMode && !this.defaultView) {
      this.defaultView = this.calendarModesMap[this.currentMode];
    }
    if (changes.currentDate && this.currentDate && !this.defaultDate) {
      this.defaultDate = this.currentDate;
    }
  }

  public onEventClick(data: {event: CalendarEvent}) {
    this.eventClick.emit(data.event);
  }

  public onNavLinkDayClick(date: Date) {
    const defaultView = this.calendarModesMap[CalendarMode.Day];
    this.calendarComponent.getApi().changeView(defaultView, date);
  }

  public onRangeSelected(data: {start: Date; end: Date}) {
    this.newEvent.emit(data);
  }

  private calendarModeByDefaultView(newView: string): CalendarMode | null {
    const index = Object.values(this.calendarModesMap).findIndex(view => view === newView);
    return index >= 0 ? (Object.keys(this.calendarModesMap)[index] as CalendarMode) : null;
  }

  public datesRender(event: {view: View; el: HTMLElement}) {
    const newView = event.view?.type;
    const newMode = this.calendarModeByDefaultView(newView);
    const newDate = event.view?.currentStart;
    if (newMode !== this.currentMode || newDate !== this.currentDate) {
      this.rangeChanged.emit({newMode, newDate});
    }
  }

  public onEventDrop(data: {event: CalendarEvent}) {
    this.eventRangeChanged.emit({...data.event, metadata: data.event.extendedProps});
  }

  public onEventResize(data: {event: CalendarEvent}) {
    this.eventRangeChanged.emit({...data.event, metadata: data.event.extendedProps});
  }
}
