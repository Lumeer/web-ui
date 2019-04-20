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

import * as moment from 'moment';

const dateTokens = ['Y', 'Q', 'D', 'G', 'g', 'W', 'w', 'E', 'e', 'D', 'd', 'L'];
const timeTokens = ['H', 'h', 'k', 'A', 'a', 'm', 'S', 's', 'X', 'x'];

export function resetUnusedDatePart(date: Date, format: string): Date {
  return resetUnusedMomentPart(moment(date), format).toDate();
}

export function resetUnusedMomentPart(date: moment.Moment, format: string): moment.Moment {
  if (!date || !format) {
    return date;
  }

  if (dateTokens.every(token => !format.includes(token))) {
    return resetUnusedDateUnits(date);
  }

  if (timeTokens.every(token => !format.includes(token))) {
    return resetUnusedTimeUnits(date);
  }

  return date;
}

function resetUnusedDateUnits(date: moment.Moment): moment.Moment {
  return date.clone().set({date: 1, month: 0, year: 1970});
}

function resetUnusedTimeUnits(date: moment.Moment): moment.Moment {
  return date.clone().startOf('day');
}
