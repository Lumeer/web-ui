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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {AttributeSortType} from '../../../../../../core/store/views/view';
import {
  ConditionType,
  ConditionValue,
  ConstraintData,
  initialConditionType,
  initialConditionValues,
} from '@lumeer/data-filters';
import {ConstraintDataService} from '../../../../../../core/service/constraint-data.service';
import {Observable} from 'rxjs';
import {DropdownPosition} from '../../../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../../../dropdown/dropdown.component';
import {FilterBuilderContentComponent} from '../../../../../builder/filter-builder/content/filter-builder-content.component';
import {Attribute} from '../../../../../../core/store/collections/collection';
import {modifyAttributeForQueryFilter} from '../../../../../utils/attribute.utils';
import {ColumnFilter} from '../../../../model/table-column';

@Component({
  selector: 'cell-filter-builder',
  templateUrl: './cell-filter-builder.component.html',
  styleUrls: ['./cell-filter-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellFilterBuilderComponent implements OnChanges, AfterViewInit {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public attribute: Attribute;

  @Input()
  public sort: AttributeSortType;

  @Input()
  public filters: ColumnFilter[];

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public editable: boolean;

  @Output()
  public sortChanged = new EventEmitter<AttributeSortType | null>();

  @Output()
  public filterRemove = new EventEmitter<number>();

  @Output()
  public filterChange = new EventEmitter<{
    index: number;
    condition: ConditionType;
    values: ConditionValue[];
    new?: boolean;
  }>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChild(FilterBuilderContentComponent)
  public contentComponent: FilterBuilderContentComponent;

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopStart,
    DropdownPosition.TopEnd,
    DropdownPosition.Left,
    DropdownPosition.Right,
  ];
  public readonly sortType = AttributeSortType;

  public constraintData$: Observable<ConstraintData>;

  public selectedIndex = 0;
  public filterAttribute: Attribute;

  public visible$: Observable<boolean>;

  constructor(private constraintDataService: ConstraintDataService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.collectionId || changes.linkTypeId) {
      this.constraintData$ = this.constraintDataService.selectWithInvalidValues$(
        this.attribute,
        this.collectionId,
        this.linkTypeId
      );
      this.filterAttribute = modifyAttributeForQueryFilter(this.attribute);
    }
    if (changes.filters) {
      setTimeout(() => this.dropdown?.updatePosition());
    }
  }

  public ngAfterViewInit() {
    this.visible$ = this.dropdown?.isOpen$();
  }

  public toggle() {
    if (this.dropdown) {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  public isOpen(): boolean {
    return this.dropdown?.isOpen();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    this.dropdown?.close();
  }

  public onFinishEditing() {
    this.close();
  }

  public onSortChanged(sort: AttributeSortType | null) {
    if (sort !== this.sort) {
      this.sortChanged.emit(sort);
    }
  }

  public onNewFilter() {
    const condition = initialConditionType(this.attribute?.constraint);
    const values = initialConditionValues(condition, this.attribute?.constraint);
    this.selectedIndex = this.filters?.length || 0;
    this.filterChange.emit({condition, values, index: this.selectedIndex, new: true});
  }

  public onValueChange(data: {condition: ConditionType; values: ConditionValue[]}) {
    this.filterChange.emit({...data, index: this.selectedIndex});
  }

  public onRemove(index: number) {
    this.filterRemove.emit(index);
    if (this.selectedIndex >= index) {
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    }
  }
}
