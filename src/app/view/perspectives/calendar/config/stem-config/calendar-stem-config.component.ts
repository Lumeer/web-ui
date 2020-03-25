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
import {CalendarBar, CalendarStemConfig} from '../../../../../core/store/calendars/calendar';
import {Collection} from '../../../../../core/store/collections/collection';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'calendar-stem-config',
  templateUrl: './calendar-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarStemConfigComponent {
  @Input()
  public selectItems: SelectItemModel[];

  @Input()
  public collection: Collection;

  @Input()
  public stem: QueryStem;

  @Input()
  public config: CalendarStemConfig;

  @Output()
  public configChange = new EventEmitter<CalendarStemConfig>();

  public readonly properties = ['name', 'start', 'end', 'color'];
  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public onBarPropertySelect(type: string, bar: CalendarBar) {
    const newConfig = {...this.config, [type]: bar};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved(type: string) {
    const newConfig = {...this.config};
    delete newConfig[type];
    this.configChange.emit(newConfig);
  }
}
