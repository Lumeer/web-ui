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

import {Constraint, DataAggregationType} from '@lumeer/data-filters';
import {LmrPivotAttribute, LmrPivotValueAttribute, LmrPivotValueType} from '@lumeer/lmr-pivot-table';

import {AttributesResource} from '../../../../../../../../core/model/resource';
import {SelectItemWithConstraintId} from '../../../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {SelectItemModel} from '../../../../../../../../shared/select/select-item/select-item.model';
import {objectValues} from '../../../../../../../../shared/utils/common.utils';
import {getAttributesResourceType} from '../../../../../../../../shared/utils/resource.utils';

@Component({
  selector: 'pivot-value-attribute-config',
  templateUrl: './pivot-value-attribute-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotValueAttributeConfigComponent {
  @Input()
  public pivotAttribute: LmrPivotValueAttribute;

  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public availableAttributes: SelectItemModel[];

  @Output()
  public attributeSelect = new EventEmitter<LmrPivotValueAttribute>();

  @Output()
  public attributeChange = new EventEmitter<LmrPivotValueAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly aggregationPlaceholder: string;
  public readonly aggregations = objectValues(DataAggregationType);
  public readonly valueTypes = objectValues(LmrPivotValueType);
  public readonly valueType = LmrPivotValueType;
  public readonly emptyValueString: string;

  constructor() {
    this.aggregationPlaceholder = $localize`:@@aggregation:Aggregation`;
    this.emptyValueString = $localize`:@@pivot.config.attribute.empty:Select attribute`;
  }

  public onAggregationSelect(aggregation: DataAggregationType) {
    const newAttribute = {...this.pivotAttribute, aggregation};
    this.attributeChange.emit(newAttribute);
  }

  public onAttributeSelected(itemId: SelectItemWithConstraintId) {
    const resource = this.attributesResources[itemId.resourceIndex];
    if (!resource) {
      return;
    }

    const resourceType = getAttributesResourceType(resource);
    const attribute: LmrPivotAttribute = {...itemId, resourceId: resource.id, resourceType};
    const headerAttribute: LmrPivotValueAttribute = {
      ...attribute,
      aggregation: this.pivotAttribute?.aggregation || DataAggregationType.Sum,
      valueType: this.pivotAttribute?.valueType || LmrPivotValueType.Default,
    };
    this.attributeSelect.emit(headerAttribute);
  }

  public onAttributeRemoved() {
    this.attributeRemove.emit();
  }

  public onValueTypeSelected(valueType: LmrPivotValueType) {
    const valueAttribute: LmrPivotValueAttribute = {...this.pivotAttribute, valueType};
    this.attributeChange.emit(valueAttribute);
  }

  public onSelectedConstraint(constraint: Constraint) {
    const headerAttribute: LmrPivotValueAttribute = {...this.pivotAttribute, constraint};
    this.attributeChange.emit(headerAttribute);
  }
}
