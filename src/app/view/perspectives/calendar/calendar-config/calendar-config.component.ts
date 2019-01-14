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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {
  CalendarBarModel,
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
} from '../../../../core/store/calendar/calendar.model';

@Component({
  selector: 'calendar-config',
  templateUrl: './calendar-config.component.html',
  styleUrls: ['./calendar-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public allConfigs: CalendarConfig[];

  @Input()
  public configOfCollection: CalendarConfig;

  @Output()
  public configChange = new EventEmitter<CalendarConfig[]>();

  public readonly calendarBarsPropertiesRequired = Object.values(CalendarBarPropertyRequired);
  public readonly calendarBarsPropertiesOptional = Object.values(CalendarBarPropertyOptional);
  public shownOptionalBar: boolean = false;

  public allRequiredPropertiesSet() {
    return (
      this.configOfCollection.barsProperties[CalendarBarPropertyRequired.NAME] &&
      this.configOfCollection.barsProperties[CalendarBarPropertyRequired.START_DATE] &&
      this.configOfCollection.barsProperties[CalendarBarPropertyRequired.END_DATE]
    );
  }

  public onBarPropertyRequiredSelect(type: CalendarBarPropertyRequired, bar: CalendarBarModel) {
    const bars = {...this.configOfCollection.barsProperties, [type]: bar};
    const newConfig = {...this.configOfCollection, barsProperties: bars};
    this.configChange.emit(this.createConfigsToEmit(newConfig));
  }

  public onBarPropertyRequiredRemoved(type: CalendarBarPropertyRequired) {
    const bars = {...this.configOfCollection.barsProperties};
    delete bars[type];
    const newConfig = {...this.configOfCollection, barsProperties: bars};
    this.configChange.emit(this.createConfigsToEmit(newConfig));
  }

  public onBarPropertyOptionalSelect(type: CalendarBarPropertyOptional, bar: CalendarBarModel) {
    const bars = {...this.configOfCollection.barsProperties, [type]: bar};
    const newConfig = {...this.configOfCollection, barsProperties: bars};
    this.configChange.emit(this.createConfigsToEmit(newConfig));
  }

  public onBarPropertyOptionalRemoved(type: CalendarBarPropertyOptional) {
    const bars = {...this.configOfCollection.barsProperties};
    delete bars[type];
    const newConfig = {...this.configOfCollection, barsProperties: bars};
    this.configChange.emit(this.createConfigsToEmit(newConfig));
  }

  public removeAllBarPropertiesOptional() {
    const bars = {...this.configOfCollection.barsProperties};
    this.calendarBarsPropertiesOptional.forEach(barOptionalProperty => {
      if (bars[barOptionalProperty]) delete bars[barOptionalProperty];
    });
    const newConfig = {...this.configOfCollection, barsProperties: bars};
    this.configChange.emit(this.createConfigsToEmit(newConfig));
  }

  public toggleOptionalBar() {
    if (this.shownOptionalBar) {
      this.removeAllBarPropertiesOptional();
    }
    this.shownOptionalBar = !this.shownOptionalBar;
  }

  private createConfigsToEmit(newConfig: CalendarConfig) {
    const newConfigs = [];
    this.allConfigs.forEach(config => {
      if (config.id !== this.configOfCollection.id) newConfigs.push(config);
      else newConfigs.push(newConfig);
    });
    return newConfigs;
  }
}
