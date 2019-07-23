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
import {Collection} from '../../../../core/store/collections/collection';
import {CalendarStemConfig, CalendarConfig} from '../../../../core/store/calendars/calendar.model';
import {Query, QueryStem} from '../../../../core/store/navigation/query';
import {deepObjectCopy} from '../../../../shared/utils/common.utils';
import {getCalendarDefaultStemConfig} from '../util/calendar-util';

@Component({
  selector: 'calendar-config',
  templateUrl: './calendar-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public config: CalendarConfig;

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<CalendarConfig>();

  public readonly defaultStemConfig = getCalendarDefaultStemConfig();

  public onCollectionConfigChange(stemConfig: CalendarStemConfig, stem: QueryStem, index: number) {
    const config = deepObjectCopy<CalendarConfig>(this.config);
    config.stemsConfigs[index] = {...stemConfig, stem};
    this.configChange.emit(config);
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }
}
