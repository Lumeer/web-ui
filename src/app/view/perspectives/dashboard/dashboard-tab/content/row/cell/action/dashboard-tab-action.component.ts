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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DashboardAction} from '../../../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../../../core/store/views/view';

@Component({
  selector: 'dashboard-tab-action',
  templateUrl: './dashboard-tab-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabActionComponent implements OnChanges {
  @Input()
  public action: DashboardAction;

  @Input()
  public views: View[];

  public view: View;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.action || changes.views) {
      this.view = this.views?.find(view => view.id === this.action?.config?.viewId);
    }
  }
}
