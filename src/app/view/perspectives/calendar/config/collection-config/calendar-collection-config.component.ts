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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {
  CalendarBar,
  CalendarBarProperty,
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarStemConfig,
} from '../../../../../core/store/calendars/calendar';
import {Collection} from '../../../../../core/store/collections/collection';

@Component({
  selector: 'calendar-collection-config',
  templateUrl: './calendar-collection-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarCollectionConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public config: CalendarStemConfig;

  @Output()
  public configChange = new EventEmitter<CalendarStemConfig>();

  public readonly calendarBarsPropertiesRequired = Object.values(CalendarBarPropertyRequired);
  public readonly calendarBarsPropertiesOptional = Object.values(CalendarBarPropertyOptional);
  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public onBarPropertySelect(type: CalendarBarProperty, bar: CalendarBar) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig: CalendarStemConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved(type: CalendarBarProperty) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    this.removeOptionalProperties(bars, type);

    const newConfig: CalendarStemConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  private removeOptionalProperties(bars: Record<string, CalendarBar>, type: CalendarBarProperty) {
    if (type === CalendarBarPropertyRequired.StartDate) {
      delete bars[CalendarBarPropertyOptional.EndDate];
    }
  }
}
