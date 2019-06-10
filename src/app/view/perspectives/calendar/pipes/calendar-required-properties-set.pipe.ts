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
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarCollectionConfig,
} from '../../../../core/store/calendars/calendar.model';

@Pipe({
  name: 'calendarRequiredPropertiesSet',
})
export class CalendarRequiredPropertiesSetPipe implements PipeTransform {
  public transform(config: CalendarCollectionConfig, propertyOptional: CalendarBarPropertyOptional): boolean {
    const requiredProperties = this.requiredProperties(propertyOptional);
    return config && config.barsProperties && requiredProperties.every(property => !!config.barsProperties[property]);
  }

  private requiredProperties(property: CalendarBarPropertyOptional): string[] {
    if (property === CalendarBarPropertyOptional.EndDate) {
      return [CalendarBarPropertyRequired.StartDate];
    }

    return Object.values(CalendarBarPropertyRequired);
  }
}
