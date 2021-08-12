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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {GanttChartBarModel, GanttChartStemConfig} from '../../../../../core/store/gantt-charts/gantt-chart';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query/query.util';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {deepObjectCopy} from '../../../../../shared/utils/common.utils';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {DataAggregationType} from '../../../../../shared/utils/data/data-aggregation';
import {Constraint} from '@lumeer/data-filters';

@Component({
  selector: 'gantt-chart-stem-config',
  templateUrl: './gantt-chart-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartStemConfigComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Input()
  public selectItems: SelectItemModel[];

  @Input()
  public config: GanttChartStemConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  @Output()
  public categoryRemove = new EventEmitter<number>();

  @Output()
  public attributeRemove = new EventEmitter<number>();

  public readonly properties = ['name', 'start', 'end', 'progress', 'color'];
  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly progressAggregations = [DataAggregationType.Avg, DataAggregationType.Sum];

  public categories: GanttChartBarModel[];
  public attributes: GanttChartBarModel[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.categories = [...(this.config.categories || []), null];
      this.attributes = [...(this.config.attributes || []), null];
    }
  }

  public onBarCategorySelect(itemId: SelectItemWithConstraintId, index: number) {
    this.onBarArraySelect(itemId, index, 'categories');
  }

  public onBarAttributeSelect(itemId: SelectItemWithConstraintId, index: number) {
    this.onBarArraySelect(itemId, index, 'attributes');
  }

  public onBarArraySelect(itemId: SelectItemWithConstraintId, index: number, key: 'categories' | 'attributes') {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    const resource = attributesResourcesOrder[itemId.resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const bar: GanttChartBarModel = {...itemId, resourceType, resourceId: resource.id};
      const newConfig = deepObjectCopy(this.config);
      if (!newConfig[key]) {
        newConfig[key] = [];
      }
      newConfig[key][index] = bar;
      this.configChange.emit(newConfig);
    }
  }

  public onBarCategoryConstraintSelect(constraint: Constraint, index: number) {
    this.onBarArrayConstraintSelect(constraint, index, 'categories');
  }

  public onBarAttributeConstraintSelect(constraint: Constraint, index: number) {
    this.onBarArrayConstraintSelect(constraint, index, 'attributes');
  }

  public onBarArrayConstraintSelect(constraint: Constraint, index: number, key: 'categories' | 'attributes') {
    const bar = this.config?.[key]?.[index];
    if (bar) {
      const newBar = {...bar, constraint};
      const newConfig: GanttChartStemConfig = deepObjectCopy(this.config);
      if (!newConfig[key]) {
        newConfig[key] = [];
      }
      newConfig[key][index] = newBar;
      this.configChange.emit(newConfig);
    }
  }

  public onBarCategoryRemoved(index: number) {
    this.categoryRemove.emit(index);
  }

  public onBarAttributeRemoved(index: number) {
    this.attributeRemove.emit(index);
  }

  public onBarPropertySelect(type: string, bar: GanttChartBarModel) {
    let newConfig: GanttChartStemConfig;
    if (type === 'progress') {
      newConfig = {...this.config, [type]: {...bar, aggregation: DataAggregationType.Avg}};
    } else {
      newConfig = {...this.config, [type]: bar};
    }
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved(type: string) {
    const newConfig = {...this.config};
    delete newConfig[type];
    this.configChange.emit(newConfig);
  }

  public onProgressAggregationSelect(aggregation: DataAggregationType) {
    const progress = {...this.config.progress, aggregation};
    const newConfig = {...this.config, progress};
    this.configChange.emit(newConfig);
  }
}
