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
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {BehaviorSubject} from 'rxjs';
import {ChartAxisModel, ChartAxisType, ChartConfig, ChartType} from '../../../../core/store/charts/chart.model';
import {Perspective} from '../../perspective';

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

  @Input()
  public canManageConfig: boolean;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public axes$ = new BehaviorSubject<ChartAxisModel[]>([]);

  public readonly chartTypes = Object.values(ChartType);
  public readonly chartPerspective = Perspective.Chart;
  public readonly axes = Object.values(ChartAxisType);

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
    const newConfig = {...this.config, type};
    this.configChange.emit(newConfig);
  }

  public onAxisSelect(type: ChartAxisType, axis: ChartAxisModel) {
    const axes = {...this.config.axes, [type]: axis};
    const newConfig = {...this.config, axes: axes};
    this.configChange.emit(newConfig);
  }

}
