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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {QueryItem} from './model/query-item';
import {AbstractControl, FormArray, FormGroup} from '@angular/forms';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {QueryItemType} from './model/query-item-type';
import {FilterBuilderComponent} from '../../../builder/filter-builder/filter-builder.component';
import {QueryCondition, QueryConditionValue} from '../../../../core/store/navigation/query/query';
import {queryConditionNumInputs} from '../../../../core/store/navigation/query/query.util';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';

@Component({
  selector: 'query-item',
  templateUrl: './query-item.component.html',
  styleUrls: ['./query-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryItemComponent implements OnInit, OnChanges {
  @Input()
  public queryItem: QueryItem;

  @Input()
  public queryItemForm: FormGroup;

  @Input()
  public readonly: boolean;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public remove = new EventEmitter();

  @Output()
  public change = new EventEmitter();

  @Output()
  public focusInput = new EventEmitter();

  @HostBinding('class.cursor-pointer')
  public cursorPointer: boolean;

  @ViewChild(FilterBuilderComponent, {static: false})
  public filterBuilderComponent: FilterBuilderComponent;

  public readonly dataInputConfiguration: DataInputConfiguration = {skipValidation: true, resizeToContent: true};

  constructor(public hostElement: ElementRef) {}

  public get conditionControl(): AbstractControl {
    return this.queryItemForm && this.queryItemForm.controls.condition;
  }

  public get conditionValuesControl(): FormArray {
    return this.queryItemForm && (this.queryItemForm.controls.conditionValues as FormArray);
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.cursorPointer = this.isAttributeType();
  }

  public ngOnInit() {
    if (this.isAttributeType() && this.queryItem.fromSuggestion) {
      setTimeout(() => this.filterBuilderComponent && this.filterBuilderComponent.open());
    }
  }

  private isAttributeType(): boolean {
    const type = this.queryItem && this.queryItem.type;
    return [QueryItemType.Attribute, QueryItemType.LinkAttribute].includes(type);
  }

  @HostListener('click')
  public onClick() {
    if (this.isAttributeType() && !this.filterBuilderComponent.isOpen()) {
      this.filterBuilderComponent.open();
    }
  }

  public onRemove() {
    this.remove.emit();
  }

  public isFormValid(): boolean {
    if (this.readonly || !this.queryItemForm) {
      return true;
    }
    return this.queryItemForm.valid;
  }

  public onQueryItemChanged() {
    if (this.isFormValid()) {
      this.change.emit();
    }
  }

  public onConditionChange(data: {condition: QueryCondition; values: QueryConditionValue[]}) {
    if (!this.queryItemForm) {
      return;
    }
    const numInputs = queryConditionNumInputs(data.condition);
    this.queryItem.condition = data.condition;
    this.queryItem.conditionValues = (data.values || []).slice(0, numInputs);
    this.queryItemForm.patchValue({
      condition: data.condition,
      conditionValues: data.values,
    });

    this.onQueryItemChanged();
  }

  public onFinishBuilderEditing() {
    this.focusInput.emit();
  }
}
