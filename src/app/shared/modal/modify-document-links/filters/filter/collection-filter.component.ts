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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  HostListener,
  ViewChild,
} from '@angular/core';
import {Attribute} from '../../../../../core/store/collections/collection';
import {SelectItem2Model} from '../../../../select/select-item2/select-item2.model';
import {ConditionType, ConditionValue, initialConditionType, initialConditionValues} from '@lumeer/data-filters';
import {findAttribute} from '../../../../../core/store/collections/collection.util';
import {FilterBuilderComponent} from '../../../../builder/filter-builder/filter-builder.component';
import {CollectionAttributeFilter} from '../../../../../core/store/navigation/query/query';

@Component({
  selector: 'collection-filter',
  templateUrl: './collection-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionFilterComponent {
  @Input()
  public filter: CollectionAttributeFilter;

  @Input()
  public attributes: Attribute[];

  @Input()
  public attributeSelectItems: SelectItem2Model[];

  @Output()
  public filterChange = new EventEmitter<CollectionAttributeFilter>();

  @Output()
  public remove = new EventEmitter();

  @ViewChild(FilterBuilderComponent)
  public filterBuilderComponent: FilterBuilderComponent;

  constructor(public element: ElementRef) {}

  public onValueChange(data: {condition: ConditionType; values: ConditionValue[]}) {
    const newFilter = {...this.filter, condition: data.condition, conditionValues: data.values};
    this.filterChange.emit(newFilter);
  }

  public onAttributeSelect(items: SelectItem2Model[]) {
    const attribute = findAttribute(this.attributes, items[0]?.id);
    if (attribute && this.filter.attributeId !== attribute.id) {
      const condition = initialConditionType(attribute.constraint);
      const newFilter: CollectionAttributeFilter = {
        ...this.filter,
        attributeId: attribute.id,
        condition,
        conditionValues: initialConditionValues(condition, attribute.constraint),
      };
      this.filterChange.emit(newFilter);

      setTimeout(() => this.filterBuilderComponent?.toggle());
    }
  }

  @HostListener('click')
  public onClick() {
    this.filterBuilderComponent?.toggle();
  }

  public onRemove() {
    this.remove.emit();
  }
}
