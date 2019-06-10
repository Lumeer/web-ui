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

import {Pipe, PipeTransform} from '@angular/core';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {CalendarMode} from '../../../../core/store/calendars/calendar.model';

@Pipe({
  name: 'calendarModesToSelect',
})
export class CalendarModesToSelectPipe implements PipeTransform {
  public constructor(private i18n: I18n) {}

  public transform(modes: CalendarMode[]): SelectItemModel[] {
    return modes.map(mode => ({id: mode, value: this.getTypeValue(mode)}));
  }

  private getTypeValue(mode: CalendarMode): string {
    return this.i18n(
      {
        id: 'perspective.calendar.config.mode',
        value: '{mode, select, month {Month} week {Week} day {Day}}',
      },
      {mode}
    );
  }
}
