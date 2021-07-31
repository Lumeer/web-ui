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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {Calendar} from './calendar';
import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {selectWorkspace} from '../navigation/navigation.state';
import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';

export interface CalendarsState extends EntityState<Calendar> {}

export const calendarsAdapter = createEntityAdapter<Calendar>({selectId: calendar => calendar.id});

export const initialCalendarsState: CalendarsState = calendarsAdapter.getInitialState();

export const selectCalendarState = (state: AppState) => state.calendars;
export const selectCalendarsDictionary = createSelector(
  selectCalendarState,
  calendarsAdapter.getSelectors().selectEntities
);
export const selectCalendarById = id => createSelector(selectCalendarsDictionary, calendars => calendars[id]);

export const selectCalendarId = createSelector(
  selectWorkspace,
  workspace => (workspace && workspace.viewCode) || DEFAULT_PERSPECTIVE_ID
);

export const selectCalendar = createSelector(selectCalendarsDictionary, selectCalendarId, (map, id) => map[id]);
export const selectCalendarConfig = createSelector(selectCalendar, calendar => calendar?.config);
