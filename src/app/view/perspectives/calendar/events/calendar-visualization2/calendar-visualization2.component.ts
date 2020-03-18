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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {CalendarEvent} from '../../util/calendar-event';
import {ButtonTextCompoundInput, ToolbarInput} from '@fullcalendar/core/types/input-types';
import {environment} from '../../../../../../environments/environment';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {FullCalendarComponent} from '@fullcalendar/angular';

@Component({
  selector: 'calendar-visualization2',
  templateUrl: './calendar-visualization2.component.html',
  styleUrls: ['./calendar-visualization2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalendarVisualization2Component {

  @Input()
  public events: CalendarEvent[];

  @Output()
  public eventClick = new EventEmitter<CalendarEvent>();

  @Output()
  public newEvent = new EventEmitter<{start: Date, end: Date}>();

  @ViewChild('calendar', {static: true})
  public calendarComponent: FullCalendarComponent;

  public readonly locale = environment.locale;
  public readonly calendarPlugins = [timeGridPlugin, dayGridPlugin, interactionPlugin];
  public readonly buttonText: ButtonTextCompoundInput = {};
  public readonly header: ToolbarInput = {
    left: 'dayGridMonth,timeGridWeek,timeGridDay',
    center: 'title',
    right: 'prev,today,next'
  };

  constructor(private i18n: I18n) {
    this.buttonText = {
      prev: i18n({id: 'perspective.calendar.header.previous', value: 'Previous'}),
      next: i18n({id: 'perspective.calendar.header.next', value: 'Next'}),
      today: i18n({id: 'perspective.calendar.header.today', value: 'Today'}),
      month: i18n({id: 'perspective.calendar.header.month', value: 'Month'}),
      week: i18n({id: 'perspective.calendar.header.week', value: 'Week'}),
      day: i18n({id: 'perspective.calendar.header.day', value: 'Day'}),
    }
  }

  public onDateClick(data: any) {
    console.log('onDayClick', data);
  }

  public onEventClick(data: {event: CalendarEvent}) {
    this.eventClick.emit(data.event);
  }

  public onNavLinkDayClick(data: any) {
    console.log('onNavLinkDayClick', data);
  }

  public onRangeSelected(data: {start: Date, end: Date}) {
    this.newEvent.emit(data);
  }
}
