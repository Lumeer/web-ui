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

import {calendarsAdapter, CalendarsState, initialCalendarsState} from './calendars.state';
import {CalendarsAction, CalendarsActionType} from './calendars.action';

export function calendarsReducer(
  state: CalendarsState = initialCalendarsState,
  action: CalendarsAction.All
): CalendarsState {
  switch (action.type) {
    case CalendarsActionType.ADD_CALENDAR:
      return calendarsAdapter.upsertOne(action.payload.calendar, state);
    case CalendarsActionType.REMOVE_CALENDAR:
      return calendarsAdapter.removeOne(action.payload.calendarId, state);
    case CalendarsActionType.SET_CONFIG:
      return calendarsAdapter.updateOne(
        {id: action.payload.calendarId, changes: {config: action.payload.config}},
        state
      );
    case CalendarsActionType.CLEAR:
      return initialCalendarsState;
    default:
      return state;
  }
}
