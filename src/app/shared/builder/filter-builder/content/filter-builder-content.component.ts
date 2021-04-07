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
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Attribute} from '../../../../core/store/collections/collection';
import {ConstraintConditionValueItem, ConditionItem} from '../model/condition-item';
import {BehaviorSubject} from 'rxjs';
import {createRange} from '../../../utils/array.utils';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {KeyCode} from '../../../key-code';
import {TranslationService} from '../../../../core/service/translation.service';
import {HiddenInputComponent} from '../../../input/hidden-input/hidden-input.component';
import {objectValues} from '../../../utils/common.utils';
import {
  ConditionType,
  conditionTypeNumberOfInputs,
  ConditionValue,
  Constraint,
  ConstraintData,
  ConstraintType,
  DataValue,
  DateTimeConstraintConditionValue,
  UnknownConstraint,
  UserConstraintConditionValue,
} from '@lumeer/data-filters';

@Component({
  selector: 'filter-builder-content',
  templateUrl: './filter-builder-content.component.html',
  styleUrls: ['./filter-builder-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBuilderContentComponent implements OnInit, OnChanges {
  @Input()
  public attribute: Attribute;

  @Input()
  public selectedValues: ConditionValue[];

  @Input()
  public selectedCondition: ConditionType;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public valueChange = new EventEmitter<{condition: ConditionType; values: ConditionValue[]}>();

  @Output()
  public finishEditing = new EventEmitter();

  @ViewChild(HiddenInputComponent)
  public hiddenInputComponent: HiddenInputComponent;

  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {common: {skipValidation: true, delaySaveAction: true}};

  public editing$ = new BehaviorSubject(-1);

  public numInputs: number;
  public ngForIndexes: number[];
  public focused$ = new BehaviorSubject({column: 0, row: 0});
  public dataValues: DataValue[];
  public conditionItems: ConditionItem[];
  public conditionValueItems: ConstraintConditionValueItem[];

  constructor(private translationService: TranslationService) {}

  public ngOnInit() {
    this.initFocusedItem();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute) {
      this.createItems();
    }
    if (changes.attribute || changes.selectedValues || changes.constraintData) {
      this.dataValues = this.createDataValues();
    }
    if (changes.selectedCondition) {
      this.numInputs = conditionTypeNumberOfInputs(this.selectedCondition);
      this.ngForIndexes = createRange(0, this.numInputs);
    }
  }

  private createItems() {
    const constraint = this.attribute?.constraint || new UnknownConstraint();
    this.conditionItems = this.createConditionItems(constraint);
    this.conditionValueItems = this.createConditionValueItems(constraint);
  }

  private createConditionItems(constraint: Constraint): ConditionItem[] {
    return constraint.conditions().map(value => ({
      value,
      title: this.translationService.translateQueryCondition(value, constraint),
    }));
  }

  private createConditionValueItems(constraint: Constraint): ConstraintConditionValueItem[] {
    let values = [];
    switch (constraint.type) {
      case ConstraintType.User:
        values = objectValues(UserConstraintConditionValue);
        break;
      case ConstraintType.DateTime:
        values = objectValues(DateTimeConstraintConditionValue);
        break;
    }

    return values.map(value => ({
      value,
      title: this.translationService.translateConstraintConditionValue(value, constraint),
    }));
  }

  private createDataValues(): DataValue[] {
    return (this.selectedValues || []).map(selectedValue => {
      const value = selectedValue?.value;
      const constraint = this.attribute?.constraint || new UnknownConstraint();
      return constraint.createDataValue(value || '', this.constraintData);
    });
  }

  public onConditionSelect(item: ConditionItem, row: number) {
    this.selectCondition(item);
    this.focusCell(row, 0);
    this.endEditing();
  }

  private focusCell(row: number, column: number) {
    this.focused$.next({row, column});
    this.hiddenInputComponent?.focus();
  }

  private selectCondition(item: ConditionItem) {
    this.valueChange.emit({condition: item.value, values: this.selectedValues});
  }

  private isEditing(): boolean {
    return this.editing$.value >= 0;
  }

  private endEditing() {
    if (this.isEditing()) {
      this.editing$.next(-1);
    }
  }

  private endFocus() {
    this.focused$.next(null);
    this.hiddenInputComponent?.blur();
  }

  public onConditionValueSelect(item: ConstraintConditionValueItem, column: number, row: number) {
    this.selectConditionValue(item, column);
    this.focusCell(row + 1, column + 1);
    this.endEditing();
  }

  private selectConditionValue(item: ConstraintConditionValueItem, index: number) {
    const value: ConditionValue = {type: item.value, value: null};

    const values = [...(this.selectedValues || [])];
    values[index] = value;

    this.valueChange.emit({condition: this.selectedCondition, values});
  }

  public startEditing(index: number) {
    this.endFocus();
    if (this.editing$.value !== index) {
      setTimeout(() => this.editing$.next(index));
    }
  }

  public onInputSave(dataValue: DataValue, column: number) {
    const value: ConditionValue = {type: null, value: dataValue.serialize()};

    const values = [...(this.selectedValues || [])];
    values[column] = value;

    this.valueChange.emit({condition: this.selectedCondition, values});
    this.endEditing();
  }

  public onInputCancel(index: number) {
    const dataValues = [...this.dataValues];
    dataValues[index] = dataValues[index].copy();
    this.dataValues = dataValues;

    this.endEditing();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (!this.focused$.value) {
      return;
    }
    switch (event.key) {
      case KeyCode.ArrowDown:
        this.moveFocusDown();
        event.stopPropagation();
        return;
      case KeyCode.ArrowUp:
        this.moveFocusUp();
        event.stopPropagation();
        return;
      case KeyCode.ArrowRight:
        this.moveFocusRight();
        event.stopPropagation();
        return;
      case KeyCode.ArrowLeft:
        this.moveFocusLeft();
        event.stopPropagation();
        return;
      case KeyCode.Tab:
        this.startEditingColumn(event.shiftKey);
        event.stopPropagation();
        event.preventDefault();
        return;
      case KeyCode.Enter:
        this.checkFinishEditingByFocus();
        event.stopPropagation();
        event.preventDefault();
        return;
    }
  }

  private moveFocusDown() {
    const focused = this.focused$.value;
    if (focused) {
      if (focused.column === 0) {
        if (focused.row < this.conditionItems.length - 1) {
          this.selectCondition(this.conditionItems[focused.row + 1]);
          this.focusCell(focused.row + 1, focused.column);
        }
      } else if (focused.row < this.conditionValueItems.length) {
        // first row in values index is data input
        this.selectConditionValue(this.conditionValueItems[focused.row], focused.column - 1);
        this.focusCell(focused.row + 1, focused.column);
      }
    }
  }

  private moveFocusUp() {
    const focused = this.focused$.value;
    if (focused) {
      if (focused.column === 0) {
        if (focused.row > 0) {
          this.selectCondition(this.conditionItems[focused.row - 1]);
          this.focusCell(focused.row - 1, focused.column);
        }
      } else {
        // first row in values index is data input
        if (focused.row > 1) {
          this.selectConditionValue(this.conditionValueItems[focused.row - 2], focused.column - 1);
          this.focusCell(focused.row - 1, focused.column);
        } else if (focused.row > 0) {
          this.startEditing(focused.column - 1);
        }
      }
    }
  }

  private moveFocusRight() {
    const focused = this.focused$.value;
    if (focused) {
      if (focused.row === 0 && focused.column === 0 && this.numInputs > 0) {
        this.startEditing(0);
        return;
      }

      const nextColumn = focused.column + 1;
      if (nextColumn <= this.numInputs) {
        const rowIndex =
          this.getSelectedRow(nextColumn) || Math.min(focused.row - 1, this.conditionValueItems.length - 1);
        this.selectConditionValue(this.conditionValueItems[rowIndex], nextColumn - 1);
        this.focusCell(rowIndex + 1, nextColumn);
      }
    }
  }

  private getSelectedRow(column: number): number | null {
    let index: number;
    if (column === 0) {
      index = (this.conditionItems || []).findIndex(item => item.value === this.selectedCondition);
    } else {
      const selectedValue = this.selectedValues?.[column - 1];
      index = (this.conditionValueItems || []).findIndex(item => item.value === selectedValue?.type);
    }

    return index >= 0 ? index : null;
  }

  private moveFocusLeft() {
    const focused = this.focused$.value;
    if (focused) {
      const nextColumn = focused.column - 1;
      if (nextColumn >= 0) {
        if (nextColumn === 0) {
          const rowIndex = this.getSelectedRow(0) || Math.min(focused.row, this.conditionItems.length - 1);
          this.selectCondition(this.conditionItems[rowIndex]);
          this.focusCell(rowIndex, nextColumn);
        } else {
          const rowIndex = this.getSelectedRow(nextColumn) || focused.row - 1;
          this.selectConditionValue(this.conditionValueItems[rowIndex], nextColumn - 1);
          this.focusCell(rowIndex + 1, nextColumn);
        }
      }
    }
  }

  private startEditingColumn(left: boolean) {
    const columnToEdit = (this.focused$.value?.column || 0) + (left ? -1 : 1);
    if (columnToEdit > this.numInputs) {
      this.finishEditing.emit();
    } else if (columnToEdit > 0) {
      this.startEditing(columnToEdit - 1);
    }
  }

  private checkFinishEditingByFocus() {
    if (this.focused$.value?.column >= this.numInputs) {
      this.finishEditing.emit();
    }
  }

  public onDataInputKeyDown(event: KeyboardEvent, column: number) {
    switch (event.code) {
      case KeyCode.Tab:
      case KeyCode.Enter:
        this.onDataInputEnterOrTabKeyDown(event, column);
    }
  }

  public onDataInputEnterOrTabKeyDown(event: KeyboardEvent, column: number) {
    event.stopPropagation();
    event.preventDefault();

    if (event.shiftKey && event.code === KeyCode.Tab) {
      if (column > 0) {
        setTimeout(() => this.editing$.next(column - 1));
      } else {
        this.endEditing();
        this.selectCondition(this.conditionItems[0]);
        this.focusCell(0, 0);
      }
      return;
    }

    if (column + 1 < this.numInputs) {
      setTimeout(() => this.editing$.next(column + 1));
    } else {
      this.finishEditing.emit();
    }
  }

  public focus() {
    this.hiddenInputComponent?.focus();
    this.initFocusedItem();
  }

  private initFocusedItem() {
    const index = this.conditionItems.findIndex(item => item.value === this.selectedCondition);
    this.focusCell(Math.max(index, 0), 0);
  }
}
