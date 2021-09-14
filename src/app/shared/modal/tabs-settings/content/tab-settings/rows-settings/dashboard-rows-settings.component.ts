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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {DashboardLayoutType, DashboardRow} from '../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'dashboard-rows-settings',
  templateUrl: './dashboard-rows-settings.component.html',
  styleUrls: ['./dashboard-rows-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRowsSettingsComponent {
  @Input()
  public rows: DashboardRow[];

  @Input()
  public selectedCoordinates: {row: number; column: number};

  @Input()
  public views: View[];

  @Output()
  public rowChange = new EventEmitter<{row: DashboardRow; index: number}>();

  @Output()
  public rowDelete = new EventEmitter();

  @Output()
  public rowMove = new EventEmitter<{from: number; to: number}>();

  @Output()
  public rowAdd = new EventEmitter<DashboardLayoutType>();

  @Output()
  public cellSelect = new EventEmitter<{row: number; column: number}>();

  public rowDropped(event: CdkDragDrop<DashboardRow, any>) {
    this.rowMove.emit({from: event.previousIndex, to: event.currentIndex});
  }

  public trackByRow(index: number, row: DashboardRow): string {
    return row.id || String(index);
  }
}
