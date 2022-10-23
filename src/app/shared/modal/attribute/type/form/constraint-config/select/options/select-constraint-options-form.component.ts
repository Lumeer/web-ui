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

import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import {SelectConstraintFormControl, SelectConstraintOptionsFormControl} from '../select-constraint-form-control';
import {moveFormArrayItem, removeAllFormArrayControls} from '../../../../../../../utils/form.utils';
import {ColorPickerComponent} from '../../../../../../../picker/color/color-picker.component';
import {unescapeHtml} from '../../../../../../../utils/common.utils';
import {DataValue, SelectConstraintOption} from '@lumeer/data-filters';
import {selectDefaultPalette} from '../../../../../../../picker/colors';
import {Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';

@Component({
  selector: 'select-constraint-options-form',
  templateUrl: './select-constraint-options-form.component.html',
  styleUrls: ['./select-constraint-options-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectConstraintOptionsFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public form: UntypedFormGroup;

  @Input()
  public options: SelectConstraintOption[];

  @Input()
  public dataValues: DataValue[];

  @ViewChildren('valueInput')
  public valueInputs: QueryList<ElementRef<HTMLInputElement>>;

  @ViewChildren('displayValueInput')
  public displayValueInputs: QueryList<ElementRef<HTMLInputElement>>;

  public readonly formControlName = SelectConstraintFormControl;
  public readonly formControlNames = SelectConstraintOptionsFormControl;
  public backgroundInitialValues: string[] = [];
  public optionsEnabled$: Observable<boolean>;

  private subscriptions = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(this.displayValuesControl.valueChanges.subscribe(() => this.checkOptionsControls()));
    this.optionsEnabled$ = this.optionsForm.statusChanges.pipe(
      startWith(''),
      map(() => this.optionsForm.enabled),
      distinctUntilChanged()
    );
  }

  private checkOptionsControls() {
    this.optionsForm.controls.forEach(control => {
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.resetForm();
      this.createForm();
    }
  }

  private resetForm() {
    removeAllFormArrayControls(this.optionsForm);
  }

  private createForm() {
    const options: SelectConstraintOption[] = this.options?.length
      ? this.options
      : (this.dataValues || []).map(dataValue => ({value: dataValue.format()}));
    options.map((option, index) => this.createOptionForm(index, option)).forEach(form => this.optionsForm.push(form));
    const optionsLength = options.length;
    if (this.optionsForm.enabled) {
      this.optionsForm.push(this.createOptionForm(optionsLength));
    }

    if (this.optionsForm.length < 2) {
      this.optionsForm.push(this.createOptionForm(optionsLength + 1));
    }
  }

  public onAddOption() {
    this.optionsForm.push(this.createOptionForm(this.optionsForm.controls.length));
  }

  public onRemoveOption(index: number) {
    this.optionsForm.removeAt(index);
  }

  public onDrop(event: CdkDragDrop<string[]>) {
    moveFormArrayItem(this.optionsForm, event.previousIndex, event.currentIndex);
  }

  public onValueInput(event: Event, index: number) {
    const value = event.target['value'];

    if (index === this.optionsForm.controls.length - 1 && value) {
      this.optionsForm.push(this.createOptionForm(this.optionsForm.controls.length));
    }
  }

  public onValueEnterKeyDown(event: KeyboardEvent, index: number) {
    event.preventDefault();

    const element = this.valueInputs.toArray()[index + 1];
    if (element) {
      element.nativeElement.focus();
    }
  }

  public onDisplayValueEnterKeyDown(event: KeyboardEvent, index: number) {
    event.preventDefault();

    const element = this.displayValueInputs.toArray()[index + 1];
    if (element) {
      element.nativeElement.focus();
    }
  }

  private createOptionForm(index: number, option?: SelectConstraintOption): UntypedFormGroup {
    const initialBackground = selectDefaultPalette[index % selectDefaultPalette.length];
    const value = unescapeHtml(option?.value || '');
    const displayValue = unescapeHtml(option?.displayValue || '');
    const displayValues = this.displayValuesControl.value;
    return new UntypedFormGroup(
      {
        [SelectConstraintOptionsFormControl.Value]: new UntypedFormControl(displayValues ? value : null),
        [SelectConstraintOptionsFormControl.DisplayValue]: new UntypedFormControl(displayValue || value),
        [SelectConstraintOptionsFormControl.Background]: new UntypedFormControl(
          option?.background || initialBackground
        ),
      },
      this.createRequiredValueValidator()
    );
  }

  private createRequiredValueValidator(): ValidatorFn {
    return (formGroup: UntypedFormGroup): ValidationErrors | null => {
      const valueControl = formGroup.get(SelectConstraintOptionsFormControl.Value);
      const displayValueControl = formGroup.get(SelectConstraintOptionsFormControl.DisplayValue);
      return this.displayValuesControl?.value &&
        displayValueControl.value &&
        !valueControl.value &&
        valueControl.value !== 0
        ? {required: true}
        : null;
    };
  }

  public onColorSave(optionIndex: number, color: string) {
    this.patchBackground(optionIndex, color);
  }

  private patchBackground(optionIndex: number, color: string) {
    this.optionsForm.at(optionIndex).patchValue({[SelectConstraintOptionsFormControl.Background]: color});
  }

  public onPaletteClick(optionIndex: number, colorPicker: ColorPickerComponent) {
    this.backgroundInitialValues[optionIndex] = this.optionsForm
      .at(optionIndex)
      .get(SelectConstraintOptionsFormControl.Background).value;
    colorPicker.open();
  }

  public onColorChange(optionIndex: number, color: string) {
    this.patchBackground(optionIndex, color);
  }

  public onColorCancel(optionIndex: number) {
    this.patchBackground(optionIndex, this.backgroundInitialValues[optionIndex]);
  }

  public get optionsForm(): UntypedFormArray {
    return this.form.get(SelectConstraintFormControl.Options) as UntypedFormArray;
  }

  public get displayValuesControl(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.DisplayValues);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
