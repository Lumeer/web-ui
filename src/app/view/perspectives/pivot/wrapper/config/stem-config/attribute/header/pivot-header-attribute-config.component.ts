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

import {Constraint} from '@lumeer/data-filters';
import {LmrPivotAttribute, LmrPivotRowColumnAttribute, LmrPivotStemData} from '@lumeer/pivot';

import {AttributesResource} from '../../../../../../../../core/model/resource';
import {SelectItemWithConstraintId} from '../../../../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {generateCorrelationId, getAttributesResourceType} from '../../../../../../../../shared/utils/resource.utils';

@Component({
  selector: 'pivot-header-attribute-config',
  templateUrl: './pivot-header-attribute-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotHeaderAttributeConfigComponent {
  @Input()
  public pivotAttribute: LmrPivotRowColumnAttribute;

  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public selectedAttributes: LmrPivotRowColumnAttribute[];

  @Input()
  public isRow: boolean;

  @Input()
  public pivotData: LmrPivotStemData;

  @Input()
  public canSetSticky: boolean;

  @Output()
  public attributeSelect = new EventEmitter<LmrPivotRowColumnAttribute>();

  @Output()
  public attributeChange = new EventEmitter<LmrPivotRowColumnAttribute>();

  @Output()
  public attributeRemove = new EventEmitter();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly showSumsId = 'pivot-show-sums-' + generateCorrelationId();
  public readonly showStickyId = 'pivot-sticky-' + generateCorrelationId();
  public readonly emptyValueString: string;

  constructor() {
    this.emptyValueString = $localize`:@@pivot.config.attribute.empty:Select attribute`;
  }

  public onShowSumsChange(checked: boolean) {
    const newAttribute = {...this.pivotAttribute, showSums: checked};
    this.attributeChange.emit(newAttribute);
  }

  public onStickyChange(checked: boolean) {
    const newAttribute = {...this.pivotAttribute, sticky: checked};
    this.attributeChange.emit(newAttribute);
  }

  public onSelected(itemId: SelectItemWithConstraintId) {
    const resource = this.attributesResources[itemId.resourceIndex];
    if (!resource) {
      return;
    }

    const resourceType = getAttributesResourceType(resource);
    const attribute: LmrPivotAttribute = {...itemId, resourceId: resource.id, resourceType};
    const headerAttribute: LmrPivotRowColumnAttribute = {...attribute, showSums: true, sort: {attribute, asc: true}};
    this.attributeSelect.emit(headerAttribute);
  }

  public onSelectedConstraint(constraint: Constraint) {
    const headerAttribute: LmrPivotRowColumnAttribute = {...this.pivotAttribute, constraint};
    this.attributeChange.emit(headerAttribute);
  }

  public onRemoved() {
    this.attributeRemove.emit();
  }
}
