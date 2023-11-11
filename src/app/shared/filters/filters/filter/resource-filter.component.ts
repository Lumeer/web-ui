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
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Attribute} from '../../../../core/store/collections/collection';
import {SelectItem2Model} from '../../../select/select-item2/select-item2.model';
import {
  AttributeFilter,
  ConditionType,
  ConditionValue,
  ConstraintData,
  initialConditionType,
  initialConditionValues,
} from '@lumeer/data-filters';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {FilterBuilderComponent} from '../../../builder/filter-builder/filter-builder.component';
import {BehaviorSubject, combineLatest, Observable, switchMap} from 'rxjs';
import {ConstraintDataService} from '../../../../core/service/constraint-data.service';
import {modifyAttributeForQueryFilter} from '../../../utils/attribute.utils';
import {CollectionAttributeFilter, LinkAttributeFilter} from '../../../../core/store/navigation/query/query';
import {map} from 'rxjs/operators';

@Component({
  selector: 'resource-filter',
  templateUrl: './resource-filter.component.html',
  styleUrls: ['./resource-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceFilterComponent implements OnInit, OnChanges {
  @Input()
  public filter: AttributeFilter;

  @Input()
  public attributes: Attribute[];

  @Input()
  public attributeSelectItems: SelectItem2Model[];

  @Input()
  public inline: boolean;

  @Output()
  public filterChange = new EventEmitter<AttributeFilter>();

  @Output()
  public remove = new EventEmitter();

  @ViewChild(FilterBuilderComponent)
  public filterBuilderComponent: FilterBuilderComponent;

  public filter$ = new BehaviorSubject<AttributeFilter>(null);
  public attributes$ = new BehaviorSubject<Attribute[]>([]);
  public inlineFilterOpened$ = new BehaviorSubject(true);
  public constraintData$: Observable<ConstraintData>;
  public attribute$: Observable<Attribute>;

  constructor(
    public element: ElementRef,
    private constraintDataService: ConstraintDataService
  ) {}

  public ngOnInit() {
    this.filter$.next(this.filter);
    this.attributes$.next(this.attributes);

    this.attribute$ = combineLatest([this.attributes$, this.filter$]).pipe(
      map(([attributes, filter]) => modifyAttributeForQueryFilter(findAttribute(attributes, filter?.attributeId)))
    );
    this.constraintData$ = combineLatest([this.attribute$, this.filter$]).pipe(
      switchMap(([attribute, filter]) => {
        const collectionId = (<CollectionAttributeFilter>filter)?.collectionId;
        const linkTypeId = (<LinkAttributeFilter>filter)?.linkTypeId;
        return this.constraintDataService.selectWithInvalidValues$(attribute, collectionId, linkTypeId);
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attributes) {
      this.attributes$.next(this.attributes);
    }
  }

  public onValueChange(data: {condition: ConditionType; values: ConditionValue[]}) {
    const newFilter = {...this.filter$.value, condition: data.condition, conditionValues: data.values};
    this.filter$.next(newFilter);
    this.filterChange.emit(newFilter);
  }

  public onAttributeSelect(items: SelectItem2Model[]) {
    const attribute = findAttribute(this.attributes, items[0]?.id);
    if (attribute && this.filter$.value.attributeId !== attribute.id) {
      const condition = initialConditionType(attribute.constraint);
      const newFilter = {
        ...this.filter$.value,
        attributeId: attribute.id,
        condition,
        conditionValues: initialConditionValues(condition, attribute.constraint),
      };
      this.filter$.next(newFilter);
      this.afterNewAttributeSelected();
    }
  }

  private afterNewAttributeSelected() {
    if (this.inline) {
      this.inlineFilterOpened$.next(true);
    } else {
      setTimeout(() => this.filterBuilderComponent?.toggle());
    }
  }

  @HostListener('click')
  public onClick() {
    if (!this.inline) {
      this.filterBuilderComponent?.toggle();
    }
  }

  public onRemove() {
    this.remove.emit();
  }

  public onFilterClick() {
    if (this.inline) {
      this.inlineFilterOpened$.next(!this.inlineFilterOpened$.value);
    }
  }

  public onInlineFinishedEditing() {
    setTimeout(() => this.inlineFilterOpened$.next(false));
  }
}
