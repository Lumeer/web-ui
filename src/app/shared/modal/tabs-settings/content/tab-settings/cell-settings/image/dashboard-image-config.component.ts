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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {
  DashboardImageCellConfig,
  DashboardImageScaleType,
  defaultDashboardImageScaleType,
} from '../../../../../../../core/model/dashboard-tab';

@Component({
  selector: 'dashboard-image-config',
  templateUrl: './dashboard-image-config.component.html',
  styleUrls: ['./dashboard-image-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardImageConfigComponent implements OnChanges {
  @Input()
  public config: DashboardImageCellConfig;

  @Output()
  public configChange = new EventEmitter<DashboardImageCellConfig>();

  public readonly scapeType = DashboardImageScaleType;

  public url: string;
  public scale: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.url = this.config?.url || '';
      this.scale = this.config?.scale || defaultDashboardImageScaleType;
    }
  }

  public onBlur() {
    const url = this.url?.trim();
    const newConfig = {...this.config, url};
    this.configChange.next(newConfig);
  }

  public onSelectScale(scale: DashboardImageScaleType) {
    const newConfig = {...this.config, scale};
    this.configChange.next(newConfig);
  }

  public revertUrl() {
    this.url = this.config?.url || '';
  }
}
