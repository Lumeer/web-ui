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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {CollectionAttributeFilter} from '../../../../core/store/navigation/query/query';
import {BehaviorSubject} from 'rxjs';
import {SelectItem2Model} from '../../../select/select-item2/select-item2.model';
import {resourceAttributesSelectItems} from '../../../select/select-item.utils';
import {AttributeFilter} from '@lumeer/data-filters';

@Component({
  selector: 'collection-filters',
  templateUrl: './collection-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionFiltersComponent {
  @Input()
  public collection: Collection;

  @Output()
  public filtersChange = new EventEmitter<CollectionAttributeFilter[]>();

  public filters$ = new BehaviorSubject<CollectionAttributeFilter[]>([]);

  public attributeSelectItems: SelectItem2Model[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.attributeSelectItems = resourceAttributesSelectItems(this.collection);
    }
  }

  public onFilterChange(index: number, filter: CollectionAttributeFilter) {
    const filters = [...this.filters$.value];
    filters[index] = filter;
    this.filters$.next(filters);
    this.filtersChange.emit(filters);
  }

  public onFilterDelete(index: number) {
    const filters = [...this.filters$.value];
    filters.splice(index, 1);
    this.filters$.next(filters);
    this.filtersChange.emit(filters);
  }

  public trackByAttributeFilter(index: number, filter: AttributeFilter): string {
    return filter.attributeId + index;
  }

  public onNewFilter() {
    const emptyFilter = {collectionId: this.collection.id, attributeId: null, condition: null, conditionValues: []};
    this.filters$.next([...this.filters$.value, emptyFilter]);
  }
}
