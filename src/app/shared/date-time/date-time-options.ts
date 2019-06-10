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

import {BsDatepickerViewMode} from 'ngx-bootstrap/datepicker';

export interface DateTimeOptions {
  year?: boolean;
  month?: boolean;
  day?: boolean;
  hours?: boolean;
  minutes?: boolean;
  seconds?: boolean;
  meridian?: boolean;
  milliseconds?: boolean;
}

export function createDateTimeOptions(format: string): DateTimeOptions {
  return (
    format && {
      year: format.includes('Y'),
      month: format.includes('M'),
      day: format.includes('D'),
      hours: format.includes('H') || format.includes('h') || format.includes('k'),
      minutes: format.includes('m'),
      seconds: format.includes('s'),
      meridian: format.includes('a'),
      milliseconds: format.includes('S'),
    }
  );
}

export function hasDateOption(options: DateTimeOptions): boolean {
  return options && (options.year || options.month || options.day);
}

export function hasTimeOption(options: DateTimeOptions): boolean {
  return options && (options.hours || options.minutes || options.seconds || options.milliseconds);
}

export function detectDatePickerViewMode(options: DateTimeOptions): BsDatepickerViewMode {
  if (!options || options.day) {
    return 'day';
  }

  if (options.month) {
    return 'month';
  }

  return 'year';
}
