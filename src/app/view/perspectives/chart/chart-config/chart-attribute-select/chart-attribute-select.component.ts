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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {ChartAxisModel, ChartAxisType} from '../../../../../core/store/chart/chart.model';

@Component({
  selector: 'chart-attribute-select',
  templateUrl: './chart-attribute-select.component.html',
  styleUrls: ['../chart-dropdown-select.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartAttributeSelectComponent implements OnChanges {

  @Input()
  public collection: CollectionModel;

  @Input()
  public axes: ChartAxisModel[];

  @Input()
  public axis: ChartAxisModel;

  @Input()
  public axisType: ChartAxisType;

  @Output()
  public select = new EventEmitter<ChartAxisModel>();

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.axes && this.axes && this.axis) {
      this.checkCurrentAxis();
    }
  }

  private checkCurrentAxis() {
    const axisFound = this.axes.find(ax => ax === this.axis);
    if (!axisFound) {
      this.select.emit(null);
    }
  }

  public onSelect(axis: ChartAxisModel) {
    this.select.emit(axis);
  }

}
