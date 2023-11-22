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

import {Observable} from 'rxjs';

import {ConditionType, ConditionValue, ConstraintData} from '@lumeer/data-filters';

import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {Attribute} from '../../../core/store/collections/collection';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {FilterBuilderContentComponent} from './content/filter-builder-content.component';

@Component({
  selector: 'filter-builder',
  templateUrl: './filter-builder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConstraintDataService],
})
export class FilterBuilderComponent implements OnChanges, AfterViewInit {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public attribute: Attribute;

  @Input()
  public conditionValues: ConditionValue[];

  @Input()
  public condition: ConditionType;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Output()
  public valueChange = new EventEmitter<{condition: ConditionType; values: ConditionValue[]}>();

  @Output()
  public finishEditing = new EventEmitter();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChild(FilterBuilderContentComponent)
  public contentComponent: FilterBuilderContentComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart];

  public constraintData$: Observable<ConstraintData>;
  public visible$: Observable<boolean>;

  constructor(private constraintDataService: ConstraintDataService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.collectionId || changes.linkTypeId) {
      this.constraintData$ = this.constraintDataService.selectWithInvalidValues$(
        this.attribute,
        this.collectionId,
        this.linkTypeId
      );
    }
  }

  public ngAfterViewInit() {
    this.visible$ = this.dropdown.isOpen$();
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
      this.contentComponent.focus();
    }
  }

  public close() {
    this.dropdown?.close();
  }

  public onValueChange(data: {condition: ConditionType; values: ConditionValue[]}) {
    this.valueChange.emit(data);
    setTimeout(() => this.dropdown.updatePosition());
  }

  public onFinishEditing() {
    this.close();
    this.finishEditing.emit();
  }
}
