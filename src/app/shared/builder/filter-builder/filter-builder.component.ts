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
  OnInit,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {Attribute} from '../../../core/store/collections/collection';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {ConstraintData} from '../../../core/model/data/constraint';
import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {Observable} from 'rxjs';
import {QueryCondition, QueryConditionValue} from '../../../core/store/navigation/query/query';
import {ConstraintConditionType} from '../../../core/model/data/constraint-condition';

@Component({
  selector: 'filter-builder',
  templateUrl: './filter-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBuilderComponent implements OnInit, OnChanges {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public attribute: Attribute;

  @Input()
  public conditionType: ConstraintConditionType;

  @Input()
  public conditionValues: any[];

  @Input()
  public condition: QueryCondition;

  @Output()
  public valueChange = new EventEmitter<{condition: QueryCondition; value: QueryConditionValue}>();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart];

  public constraintData$: Observable<ConstraintData>;

  public conditionValue: QueryConditionValue;

  constructor(private constraintDataService: ConstraintDataService) {}

  public ngOnInit() {
    this.constraintData$ = this.constraintDataService.observeConstraintData();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.conditionType || changes.conditionValues) {
      this.conditionValue = {type: this.conditionType, values: this.conditionValues};
    }
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onValueChange(data: {condition: QueryCondition; value: QueryConditionValue}) {
    this.valueChange.emit(data);
    setTimeout(() => this.dropdown.updatePosition());
  }
}
