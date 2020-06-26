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
import {
  FullCalendarComponent,
  ButtonTextCompoundInput,
  CustomButtonInput,
  ToolbarInput,
  CalendarOptions,
} from '@fullcalendar/angular';
import {ViewApi} from '@fullcalendar/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {CalendarEvent, CalendarMetaData} from '../../util/calendar-event';
import {environment} from '../../../../../../environments/environment';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {CalendarMode} from '../../../../../core/store/calendars/calendar';
import * as moment from 'moment';

@Component({
  selector: 'calendar-visualization',
  templateUrl: './calendar-visualization.component.html',
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
  public readonly moreText: string;
  public readonly noEventsText: string;
  public readonly calendarText: string;
  public readonly listText: string;
  public readonly listCustomButtons: Record<string, CustomButtonInput>;
  public readonly calendarCustomButtons: Record<string, CustomButtonInput>;
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
  public calendarOptions: CalendarOptions;

  constructor(private i18n: I18n) {
    this.calendarText = this.i18n({id: 'perspective.calendar.display.calendar', value: 'Calendar'});
    this.listText = this.i18n({id: 'perspective.calendar.display.list', value: 'List'});
    this.moreText = this.i18n({id: 'perspective.calendar.display.more', value: 'more'});
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
    this.listCustomButtons = {
      calendarToggle: {
        text: this.calendarText,
        click: () => this.listToggle.emit(false),
      },
    };
    this.calendarCustomButtons = {
      listToggle: {
        text: this.listText,
        click: () => this.listToggle.emit(true),
      },
    };
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.currentMode && this.currentMode && !this.defaultView) {
      this.defaultView = this.getCalendarModeString(this.currentMode);
    }
    if (changes.currentDate && changes.currentDate.isFirstChange() && this.currentDate && !this.defaultDate) {
      this.defaultDate = this.currentDate;
    }
    if (changes.currentMode || changes.currentDate || changes.list) {
      this.checkCalendarModeChanged(!!changes.list);
    }
    this.createCalendarOptions();
  }

  private createCalendarOptions() {
    this.calendarOptions = {
      initialView: this.defaultView,
      initialDate: this.defaultDate,
      events: this.events,
      plugins: this.calendarPlugins,
      navLinks: true,
      selectable: this.canCreateEvents,
      customButtons: this.list ? this.listCustomButtons : this.calendarCustomButtons,
      locale: this.locale,
      firstDay: moment.localeData(this.locale).firstDayOfWeek(),
      buttonText: this.buttonText,
      allDayText: this.allDayText,
      noEventsText: this.noEventsText,
      dayMaxEventRows: 10,
      moreLinkContent: this.moreText,
      headerToolbar: this.list ? this.listHeader : this.calendarHeader,
      nowIndicator: true,
      stickyHeaderDates: true,
      eventClick: this.onEventClick.bind(this),
      eventChange: this.onEventResize.bind(this),
      select: this.onRangeSelected.bind(this),
      datesSet: this.datesRender.bind(this),
      navLinkDayClick: this.onNavLinkDayClick.bind(this),
    };

    // TODO timeGridEventMinHeight
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

  public datesRender(event: {view: ViewApi; el: HTMLElement}) {
    const newView = event.view?.type;
    const newMode = this.calendarModeByDefaultView(newView);
    const newDate = this.getNewDate(event.view);
    if (newMode !== this.currentMode || newDate !== this.currentDate) {
      this.rangeChanged.emit({newMode, newDate});
    }
  }

  private getNewDate(view: ViewApi): Date {
    const today = new Date();
    if (view.currentStart <= today && view.currentEnd >= today) {
      return moment(today).startOf('day').toDate();
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
