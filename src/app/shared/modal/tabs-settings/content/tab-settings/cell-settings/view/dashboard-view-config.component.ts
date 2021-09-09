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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {DashboardViewCellConfig} from '../../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../../core/store/views/view';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';

@Component({
  selector: 'dashboard-view-config',
  templateUrl: './dashboard-view-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardViewConfigComponent implements OnChanges {

  @Input()
  public config: DashboardViewCellConfig;

  @Input()
  public views: View[];

  @Output()
  public configChange = new EventEmitter<DashboardViewCellConfig>();

  public viewSelectItems: SelectItemModel[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.views) {
      this.viewSelectItems = this.createSelectItems();
    }
  }

  private createSelectItems(): SelectItemModel[] {
    return (this.views || []).map(view => ({
      id: view.id,
      value: view.name,
      icons: [view.icon],
      iconColors: [view.color],
    }))
  }

  public onViewSelected(viewId: string) {
    const newConfig = {...this.config, viewId};
    this.configChange.next(newConfig);
  }
}
