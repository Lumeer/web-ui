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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {BehaviorSubject} from 'rxjs';
import {ChartAction} from '../../../../core/store/chart/chart.action';
import {ChartAxisModel, ChartAxisType, ChartConfig, ChartType} from '../../../../core/store/chart/chart.model';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';

@Component({
  selector: 'chart-config',
  templateUrl: './chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartConfigComponent implements OnChanges {

  @Input()
  public collection: CollectionModel;

  @Input()
  public config: ChartConfig;

  public axes$ = new BehaviorSubject<ChartAxisModel[]>([]);

  public readonly xAxis = ChartAxisType.X;
  public readonly y1Axis = ChartAxisType.Y1;
  public readonly y2Axis = ChartAxisType.Y2;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.createAxesFromCollections();
    }
  }

  private createAxesFromCollections() {
    if (this.collection) {
      const newAxes = this.collection.attributes.map(attribute => ({collectionId: this.collection.id, attributeId: attribute.id}));
      this.axes$.next(newAxes);
    }
  }

  public onTypeSelect(type: ChartType) {
    this.store$.dispatch(new ChartAction.SelectType({type}));
  }

  public onXAxisSelect(axis: ChartAxisModel) {
    this.store$.dispatch(new ChartAction.SelectXAxis({axis}));
  }

  public onY1AxisSelect(axis: ChartAxisModel) {
    this.store$.dispatch(new ChartAction.SelectY1Axis({axis}));
  }

  public onY2AxisSelect(axis: ChartAxisModel) {
    this.store$.dispatch(new ChartAction.SelectY2Axis({axis}));
  }

}
