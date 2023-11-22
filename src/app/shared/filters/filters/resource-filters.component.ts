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

import {BehaviorSubject} from 'rxjs';

import {AttributeFilter} from '@lumeer/data-filters';

import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {findAttribute} from '../../../core/store/collections/collection.util';
import {CollectionAttributeFilter, LinkAttributeFilter} from '../../../core/store/navigation/query/query';
import {areConditionValuesDefined} from '../../../core/store/navigation/query/query.util';
import {SelectItem2Model} from '../../select/select-item2/select-item2.model';
import {resourceAttributesSelectItems} from '../../select/select-item.utils';

@Component({
  selector: 'resource-filters',
  templateUrl: './resource-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFiltersComponent implements OnChanges {
  @Input()
  public resource: AttributesResource;

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public inline: boolean;

  @Input()
  public filters: AttributeFilter[];

  @Output()
  public filtersChange = new EventEmitter<AttributeFilter[]>();

  public filters$ = new BehaviorSubject<AttributeFilter[]>([]);

  public attributeSelectItems: SelectItem2Model[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource) {
      this.attributeSelectItems = resourceAttributesSelectItems(this.resource);
    }
    if (changes.filters && changes.filters.firstChange) {
      this.filters$.next(this.filters || []);
    }
  }

  private onFiltersChanged() {
    const validFilters = this.filterValidFilters();
    this.filtersChange.emit(validFilters);
  }

  private filterValidFilters(): AttributeFilter[] {
    return this.filters$.value.filter(filter => {
      const attribute = findAttribute(this.resource.attributes, filter.attributeId);
      const valuesDefined =
        attribute && areConditionValuesDefined(filter.condition, filter.conditionValues, attribute?.constraint?.type);
      return attribute && valuesDefined;
    });
  }

  public onFilterChange(index: number, filter: AttributeFilter) {
    const filters = [...this.filters$.value];
    filters[index] = filter;
    this.filters$.next(filters);
    this.onFiltersChanged();
  }

  public onFilterDelete(index: number) {
    const filters = [...this.filters$.value];
    filters.splice(index, 1);
    this.filters$.next(filters);
    this.onFiltersChanged();
  }

  public trackByAttributeFilter(index: number, filter: AttributeFilter): string {
    return index.toString();
  }

  public onNewFilter() {
    let emptyFilter: CollectionAttributeFilter | LinkAttributeFilter;
    if (this.resourceType === AttributesResourceType.Collection) {
      emptyFilter = {collectionId: this.resource.id, attributeId: null, condition: null, conditionValues: []};
    } else {
      emptyFilter = {linkTypeId: this.resource.id, attributeId: null, condition: null, conditionValues: []};
    }

    this.filters$.next([...this.filters$.value, emptyFilter]);
  }
}
