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

import {deepObjectCopy} from '@lumeer/utils';

import {ChartConfig} from '../../../../../core/store/charts/chart';
import {generateId} from '../../../../../shared/utils/resource.utils';

@Component({
  selector: 'chart-settings-config',
  templateUrl: './chart-settings-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSettingsConfigComponent {
  @Input()
  public config: ChartConfig;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public readonly lockAxesId = generateId();
  public readonly rangeSliderId = generateId();

  public onLockAxesChange(checked: boolean) {
    this.onBooleanPropertyChange('lockAxes', checked);
  }

  public onRangeSliderChange(checked: boolean) {
    this.onBooleanPropertyChange('rangeSlider', checked);
  }

  private onBooleanPropertyChange(property: string, checked: boolean) {
    const config = deepObjectCopy<ChartConfig>(this.config);
    if (checked) {
      config[property] = true;
    } else {
      delete config[property];
    }

    this.configChange.emit(config);
  }
}
