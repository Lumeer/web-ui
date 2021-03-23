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
  ButtonTextCompoundInput,
  CalendarOptions,
  CustomButtonInput,
  FullCalendarComponent,
  ToolbarInput,
} from '@fullcalendar/angular';
import {ViewApi} from '@fullcalendar/common';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import {CalendarEvent, CalendarMetaData} from '../../util/calendar-event';
import {
  CalendarGridMode,
  CalendarMode,
  SlotDuration,
  slotDurationsMap,
} from '../../../../../core/store/calendars/calendar';
import * as moment from 'moment';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

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

  @Input()
  public slotDuration = slotDurationsMap[SlotDuration.Half];

  @Input()
  public sidebarOpened: boolean;

  @Output()
  public eventClick = new EventEmitter<CalendarEvent>();

  @Output()
  public newEvent = new EventEmitter<{start: Date; end: Date; resourceId?: string}>();

  @Output()
  public rangeChanged = new EventEmitter<{newMode: CalendarMode; newDate: Date}>();

  @Output()
  public eventRangeChanged = new EventEmitter<{metadata: CalendarMetaData; start: Date; end: Date; moved?: boolean}>();

  @Output()
  public listToggle = new EventEmitter<boolean>();

  @ViewChild('calendar', {static: true})
  public calendarComponent: FullCalendarComponent;

  public readonly locale: string;
  public readonly calendarPlugins = [
    timeGridPlugin,
    dayGridPlugin,
    interactionPlugin,
    listPlugin,
    resourceTimeGridPlugin,
  ];
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
  public readonly gridCalendarHeader: ToolbarInput = {
    left: `dayGridMonth,resourceTimeGridWeek,resourceTimeGridDay listToggle`,
    center: 'title',
    right: 'prev,today,next',
  };

  public defaultView: string;
  public defaultDate: Date;
  public calendarOptions: CalendarOptions;

  private setupInitialDate = true;

  constructor(private configurationService: ConfigurationService) {
    this.locale = configurationService.getConfiguration().locale;
    this.calendarText = $localize`:@@perspective.calendar.display.calendar:Calendar`;
    this.listText = $localize`:@@perspective.calendar.display.list:List`;
    this.moreText = $localize`:@@perspective.calendar.display.more:more`;
    this.allDayText = $localize`:@@perspective.calendar.display.allDay:All day`;
    this.noEventsText = $localize`:@@perspective.calendar.display.empty:There are no events in current selected range`;
    this.buttonText = {
      today: $localize`:@@perspective.calendar.header.today:Today`,
      month: $localize`:@@perspective.calendar.header.month:Month`,
      week: $localize`:@@perspective.calendar.header.week:Week`,
      day: $localize`:@@perspective.calendar.header.day:Day`,
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
    if (changes.currentDate?.isFirstChange() && this.currentDate) {
      this.defaultDate = this.currentDate;
    } else if (
      (changes.currentDate || changes.events) &&
      this.events?.length > 0 &&
      !this.defaultDate &&
      this.setupInitialDate
    ) {
      this.defaultDate = this.setupDefaultDate();
      this.setupInitialDate = false;
      this.checkCalendarModeChanged(!!changes.list, this.currentMode, this.defaultDate);
    } else if (changes.currentMode || changes.currentDate || changes.list || changes.events) {
      this.checkCalendarModeChanged(!!changes.list, this.currentMode, this.currentDate);
    }
    if (changes.toolbarOpened) {
      this.calendarComponent?.getApi()?.updateSize();
    }
    this.createCalendarOptions();
  }

  private setupDefaultDate(): Date {
    const sortedEvents = this.events.sort((a, b) => a.start.getTime() - b.start.getTime());
    const todayDate = moment().startOf('day').toDate().getTime();
    const firstEventInFuture = sortedEvents.find(event => event.start.getTime() >= todayDate);
    return moment(firstEventInFuture?.start || sortedEvents[sortedEvents.length - 1].start)
      .startOf('day')
      .toDate();
  }

  private createCalendarOptions() {
    this.calendarOptions = {
      schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
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
      height: 'auto',
      eventMinHeight: 40,
      dayMaxEventRows: 10,
      moreLinkText: this.moreText,
      headerToolbar: this.list
        ? this.listHeader
        : this.hasResourcesGroups()
        ? this.gridCalendarHeader
        : this.calendarHeader,
      nowIndicator: true,
      stickyHeaderDates: true,
      eventClick: this.onEventClick.bind(this),
      eventDrop: this.onEventDrop.bind(this),
      eventResize: this.onEventResize.bind(this),
      select: this.onRangeSelected.bind(this),
      datesSet: this.datesRender.bind(this),
      navLinkDayClick: this.onNavLinkDayClick.bind(this),
    };

    if (this.slotDuration && this.currentMode !== CalendarMode.Month) {
      this.calendarOptions.slotDuration = slotDurationsMap[this.slotDuration];
    }

    if (this.hasResourcesGroups() && this.currentMode !== CalendarMode.Month) {
      this.calendarOptions.resources = this.getResourceGroups();
      this.calendarOptions.datesAboveResources = true;
    }
  }

  private getResourceGroups(): {id: string; title: string}[] {
    return this.events?.reduce((result, event) => {
      for (let i = 0; i < event.resourceIds?.length; i++) {
        const id = event.resourceIds[i];
        if (!result.find(res => res.id === id)) {
          result.push({id, title: event.extendedProps.formattedGroups[i]});
        }
      }

      return result;
    }, []);
  }

  private hasResourcesGroups(): boolean {
    return this.events && this.events.length > 0 && isNotNullOrUndefined(this.events[0].extendedProps.stemConfig.group);
  }

  private translateMode(mode: CalendarMode): string {
    if (this.hasResourcesGroups()) {
      if (mode === CalendarMode.Day) {
        return CalendarGridMode.Day;
      } else if (mode === CalendarMode.Week) {
        return CalendarGridMode.Week;
      }
    }

    return this.getCalendarModeString(mode);
  }

  private getCalendarModeString(mode: CalendarMode): string {
    switch (mode) {
      case CalendarMode.Month:
        return this.list ? 'listMonth' : 'dayGridMonth';
      case CalendarMode.Week:
        return this.list ? 'listWeek' : this.hasResourcesGroups() ? CalendarGridMode.Week : 'timeGridWeek';
      case CalendarMode.Day:
        return this.list ? 'listDay' : this.hasResourcesGroups() ? CalendarGridMode.Day : 'timeGridDay';
      default:
        return '';
    }
  }

  private checkCalendarModeChanged(force: boolean, mode: CalendarMode, date: Date) {
    const currentView = this.calendarComponent?.getApi()?.view?.type;
    const currentMode = this.calendarModeByDefaultView(currentView);
    const currentDate = this.calendarComponent?.getApi()?.getDate();

    if (
      force ||
      (currentMode && currentDate && date && (currentMode !== mode || currentDate.getTime() !== date.getTime())) ||
      this.defaultView !== this.getCalendarModeString(mode)
    ) {
      this.defaultView = this.getCalendarModeString(mode);
      this.calendarComponent?.getApi()?.changeView(this.getCalendarModeString(mode), date);
    }
  }

  public onEventClick(data: {event: CalendarEvent}) {
    this.eventClick.emit(data.event);
  }

  public onNavLinkDayClick(date: Date) {
    const defaultView = this.getCalendarModeString(CalendarMode.Day);
    this.calendarComponent.getApi().changeView(defaultView, date);
  }

  public onRangeSelected(data: {start: Date; end: Date; resource?: {id: string}}) {
    this.newEvent.emit({start: data.start, end: data.end, resourceId: data.resource?.id});
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
