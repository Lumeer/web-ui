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
import listPlugin from '@fullcalendar/list';
import View from '@fullcalendar/core/View';
import {FullCalendarComponent} from '@fullcalendar/angular';
import {ButtonTextCompoundInput, CustomButtonInput, ToolbarInput} from '@fullcalendar/core/types/input-types';
import {CalendarEvent, CalendarMetaData} from '../../util/calendar-event';
import {environment} from '../../../../../../environments/environment';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {CalendarMode} from '../../../../../core/store/calendars/calendar';
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

  @Input()
  public canCreateEvents: boolean;

  @Input()
  public list: boolean;

  @Output()
  public eventClick = new EventEmitter<CalendarEvent>();

  @Output()
  public newEvent = new EventEmitter<{start: Date; end: Date}>();

  @Output()
  public rangeChanged = new EventEmitter<{newMode: CalendarMode; newDate: Date}>();

  @Output()
  public eventRangeChanged = new EventEmitter<{metadata: CalendarMetaData; start: Date; end: Date; moved?: boolean}>();

  @Output()
  public listToggle = new EventEmitter<boolean>();

  @ViewChild('calendar', {static: true})
  public calendarComponent: FullCalendarComponent;

  public readonly locale = environment.locale;
  public readonly calendarPlugins = [timeGridPlugin, dayGridPlugin, interactionPlugin, listPlugin];
  public readonly buttonText: ButtonTextCompoundInput = {};
  public readonly allDayText: string;
  public readonly noEventsText: string;
  public readonly listCustomButtons: Record<string, CustomButtonInput> = {
    calendarToggle: {
      text: 'Calendar',
      click: () => this.listToggle.emit(false),
    },
  };
  public readonly calendarCustomButtons: Record<string, CustomButtonInput> = {
    listToggle: {
      text: 'List',
      click: () => this.listToggle.emit(true),
    },
  };
  public readonly listHeader: ToolbarInput = {
    left: `listMonth,listWeek,listDay calendarToggle`,
    center: 'title',
    right: 'prev,today,next',
  };
  public readonly calendarHeader: ToolbarInput = {
    left: `dayGridMonth,timeGridWeek,timeGridDay listToggle`,
    center: 'title',
    right: 'prev,today,next',
  };

  public defaultView: string;
  public defaultDate: Date;

  constructor(private i18n: I18n) {
    this.allDayText = this.i18n({id: 'perspective.calendar.display.allDay', value: 'All day'});
    this.noEventsText = this.i18n({
      id: 'perspective.calendar.display.empty',
      value: 'There are no events in current selected range',
    });
    this.buttonText = {
      today: i18n({id: 'perspective.calendar.header.today', value: 'Today'}),
      month: i18n({id: 'perspective.calendar.header.month', value: 'Month'}),
      week: i18n({id: 'perspective.calendar.header.week', value: 'Week'}),
      day: i18n({id: 'perspective.calendar.header.day', value: 'Day'}),
    };
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.currentMode && this.currentMode && !this.defaultView) {
      this.defaultView = this.getCalendarModeString(this.currentMode);
    }
    if (changes.currentDate && this.currentDate && !this.defaultDate) {
      this.defaultDate = this.currentDate;
    }
    if (changes.currentMode || changes.currentDate || changes.list) {
      this.checkCalendarModeChanged(!!changes.list);
    }
  }

  private getCalendarModeString(mode: CalendarMode): string {
    switch (mode) {
      case CalendarMode.Month:
        return this.list ? 'listMonth' : 'dayGridMonth';
      case CalendarMode.Week:
        return this.list ? 'listWeek' : 'timeGridWeek';
      case CalendarMode.Day:
        return this.list ? 'listDay' : 'timeGridDay';
      default:
        return '';
    }
  }

  private checkCalendarModeChanged(force: boolean) {
    const currentView = this.calendarComponent?.getApi()?.view?.type;
    const currentMode = this.calendarModeByDefaultView(currentView);
    const currentDate = this.calendarComponent?.getApi()?.getDate();

    if (
      force ||
      (currentMode &&
        currentDate &&
        this.currentDate &&
        (currentMode !== this.currentMode || currentDate.getTime() !== this.currentDate.getTime()))
    ) {
      this.calendarComponent?.getApi()?.changeView(this.getCalendarModeString(this.currentMode), this.currentDate);
    }
  }

  public onEventClick(data: {event: CalendarEvent}) {
    this.eventClick.emit(data.event);
  }

  public onNavLinkDayClick(date: Date) {
    const defaultView = this.getCalendarModeString(CalendarMode.Day);
    this.calendarComponent.getApi().changeView(defaultView, date);
  }

  public onRangeSelected(data: {start: Date; end: Date}) {
    this.newEvent.emit(data);
  }

  private calendarModeByDefaultView(newView: string): CalendarMode | null {
    const modes = [CalendarMode.Month, CalendarMode.Week, CalendarMode.Day];
    return modes.find(mode => this.getCalendarModeString(mode) === newView);
  }

  public datesRender(event: {view: View; el: HTMLElement}) {
    const newView = event.view?.type;
    const newMode = this.calendarModeByDefaultView(newView);
    const newDate = this.getNewDate(event.view);
    if (newMode !== this.currentMode || newDate !== this.currentDate) {
      this.rangeChanged.emit({newMode, newDate});
    }
  }

  private getNewDate(view: View): Date {
    const today = new Date();
    if (view.currentStart <= today && view.currentEnd >= today) {
      return moment(today)
        .startOf('day')
        .toDate();
    }
    return view.currentStart;
  }

  public onEventDrop(data: {event: CalendarEvent}) {
    this.eventRangeChanged.emit({
      start: data.event.start,
      end: data.event.end,
      metadata: data.event.extendedProps,
      moved: true,
    });
  }

  public onEventResize(data: {event: CalendarEvent}) {
    this.eventRangeChanged.emit({start: data.event.start, end: data.event.end, metadata: data.event.extendedProps});
  }
}
