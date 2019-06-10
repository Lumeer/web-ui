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

import {Action} from '@ngrx/store';
import {CalendarConfig, CalendarModel} from './calendar.model';

export enum CalendarsActionType {
  ADD_CALENDAR = '[Calendar] Add calendar',
  REMOVE_CALENDAR = '[Calendar] Remove calendar',
  SET_CONFIG = '[Calendar] Set config',
  CLEAR = '[Calendar] Clear',
}

export namespace CalendarsAction {
  export class AddCalendar implements Action {
    public readonly type = CalendarsActionType.ADD_CALENDAR;

    public constructor(public payload: {calendar: CalendarModel}) {}
  }

  export class RemoveCalendar implements Action {
    public readonly type = CalendarsActionType.REMOVE_CALENDAR;

    public constructor(public payload: {calendarId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = CalendarsActionType.SET_CONFIG;

    public constructor(public payload: {calendarId: string; config: CalendarConfig}) {}
  }

  export class Clear implements Action {
    public readonly type = CalendarsActionType.CLEAR;
  }

  export type All = AddCalendar | RemoveCalendar | SetConfig | Clear;
}
