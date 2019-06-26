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
import {Collection} from '../../../../../core/store/collections/collection';
import {
  GanttChartBarModel,
  GanttChartBarProperty,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartCollectionConfig,
} from '../../../../../core/store/gantt-charts/gantt-chart';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../core/store/navigation/query';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {Constraint} from '../../../../../core/model/data/constraint';
import {queryStemAttributesResourcesOrder} from '../../../../../core/store/navigation/query.util';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';

@Component({
  selector: 'gantt-chart-collection-config',
  templateUrl: './gantt-chart-collection-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartCollectionConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Input()
  public selectItems: SelectItemModel[];

  @Input()
  public config: GanttChartCollectionConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartCollectionConfig>();

  public readonly propertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly propertiesOptionalSimple = [
    GanttChartBarPropertyOptional.Progress,
    GanttChartBarPropertyOptional.Color,
  ];
  public readonly propertiesOptionalConstraint = [
    GanttChartBarPropertyOptional.Category,
    GanttChartBarPropertyOptional.SubCategory,
  ];
  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public onBarConstraintPropertySelect(type: GanttChartBarProperty, itemId: SelectItemWithConstraintId) {
    const attributesResourcesOrder = queryStemAttributesResourcesOrder(this.stem, this.collections, this.linkTypes);
    const resource = attributesResourcesOrder[itemId.resourceIndex];
    if (resource) {
      const resourceType = getAttributesResourceType(resource);
      const bar: GanttChartBarModel = {...itemId, resourceType, resourceId: resource.id};
      this.onBarPropertySelect(type, bar);
    }
  }

  public onBarConstraintSelect(type: GanttChartBarProperty, constraint: Constraint) {
    const bar = this.config.barsProperties[type];
    if (bar) {
      const newBar = {...bar, constraint};
      this.onBarPropertySelect(type, newBar);
    }
  }

  public onBarPropertySelect(type: GanttChartBarProperty, bar: GanttChartBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved(type: GanttChartBarProperty) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }
}
