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
import {
  CalendarStemConfig,
  CalendarConfig,
  SlotDuration,
  CalendarMode,
} from '../../../../core/store/calendars/calendar';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {deepObjectCopy} from '../../../../shared/utils/common.utils';
import {getCalendarDefaultStemConfig} from '../util/calendar-util';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {generateId} from '../../../../shared/utils/resource.utils';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {parseSelectTranslation} from '../../../../shared/utils/translation.utils';

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
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<CalendarConfig>();

  public readonly savePositionId = generateId();
  public readonly defaultStemConfig = getCalendarDefaultStemConfig();
  public readonly slotDurations = this.getSlotDurationItems();
  public readonly defaultDuration = SlotDuration.Half;
  public readonly configModeMonth = CalendarMode.Month;

  public onStemConfigChange(stemConfig: CalendarStemConfig, stem: QueryStem, index: number) {
    const config = deepObjectCopy<CalendarConfig>(this.config);
    config.stemsConfigs[index] = {...stemConfig, stem};
    this.configChange.emit(config);
  }

  public trackByStem(index: number, stem: QueryStem): string {
    return stem.collectionId + index;
  }

  public onSavePositionChange(checked: boolean) {
    this.onBooleanPropertyChange('positionSaved', checked);
  }

  private onBooleanPropertyChange(property: string, checked: boolean) {
    const config = deepObjectCopy<CalendarConfig>(this.config);
    if (checked) {
      config[property] = true;
    } else {
      delete config[property];
    }

    this.configChange.emit(config);
  }

  private getSlotDurationItems(): SelectItemModel[] {
    return Object.keys(SlotDuration).map(key => {
      return {
        id: key,
        value: this.getDurationString(key),
      };
    });
  }

  private getDurationString(key: string) {
    return parseSelectTranslation(
      $localize`:@@perspective.calendar.config.slotDuration.value:{key, select, Hour {1 hour} Half {30 minutes} Quarter {15 minutes} Ten {10 minutes} Five {5 minutes}}`,
      {key}
    );
  }

  public onSlotDurationChange(selected: SlotDuration) {
    const config = {...this.config, slotDuration: selected};

    this.configChange.emit(config);
  }
}
