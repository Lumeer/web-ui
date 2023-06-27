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
import {GanttChartBarModel, GanttChartStemConfig} from '../../../../../../core/store/gantt-charts/gantt-chart';
import {Collection} from '../../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintId} from '../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {queryStemAttributesResourcesOrder} from '../../../../../../core/store/navigation/query/query.util';
import {getAttributesResourceType} from '../../../../../../shared/utils/resource.utils';
import {deepObjectCopy} from '../../../../../../shared/utils/common.utils';
import {Constraint} from '@lumeer/data-filters';

@Component({
  selector: 'gantt-chart-array-bar-model-select',
  templateUrl: './gantt-chart-array-bar-model-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartArrayBarModelSelectComponent implements OnChanges {
  @Input()
  public config: GanttChartStemConfig;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Input()
  public property: string;

  @Input()
  public translationProperty: string;

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  @Output()
  public remove = new EventEmitter<number>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public models: GanttChartBarModel[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config || changes.property) {
      this.models = [...(this.config?.[this.property] || []), null];
    }
  }

  public onSelect(itemId: SelectItemWithConstraintId, index: number) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    const resource = attributesResourcesOrder[itemId.resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const bar: GanttChartBarModel = {...itemId, resourceType, resourceId: resource.id};
      const newConfig = deepObjectCopy(this.config);
      if (!newConfig[this.property]) {
        newConfig[this.property] = [];
      }
      newConfig[this.property][index] = bar;
      this.configChange.emit(newConfig);
    }
  }

  public onConstraintSelect(constraint: Constraint, index: number) {
    const bar = this.config?.[this.property]?.[index];
    if (bar) {
      const newBar = {...bar, constraint};
      const newConfig: GanttChartStemConfig = deepObjectCopy(this.config);
      if (!newConfig[this.property]) {
        newConfig[this.property] = [];
      }
      newConfig[this.property][index] = newBar;
      this.configChange.emit(newConfig);
    }
  }
}
