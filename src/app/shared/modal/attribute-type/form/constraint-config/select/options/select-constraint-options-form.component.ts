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
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import {FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {selectDefaultPalette, SelectConstraintOption} from '../../../../../../../core/model/data/constraint-config';
import {SelectConstraintOptionsFormControl} from '../select-constraint-form-control';
import {moveFormArrayItem, removeAllFormArrayControls} from '../../../../../../utils/form.utils';
import {ColorPickerComponent} from '../../../../../../picker/color/color-picker.component';
import {unescapeHtml} from '../../../../../../utils/common.utils';

const MAX_PREDEFINED_VALUES = 100;

@Component({
  selector: 'select-constraint-options-form',
  templateUrl: './select-constraint-options-form.component.html',
  styleUrls: ['./select-constraint-options-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectConstraintOptionsFormComponent implements OnChanges {
  @Input()
  public displayValues: boolean;

  @Input()
  public form: FormArray;

  @Input()
  public options: SelectConstraintOption[];

  @Input()
  public uniqueValues: any[];

  @ViewChildren('valueInput')
  public valueInputs: QueryList<ElementRef<HTMLInputElement>>;

  @ViewChildren('displayValueInput')
  public displayValueInputs: QueryList<ElementRef<HTMLInputElement>>;

  public readonly formControlNames = SelectConstraintOptionsFormControl;
  public backgroundInitialValues: string[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.resetForm();
      this.createForm();
    }
    if (changes.displayValues) {
      this.form.controls.forEach(control => control.updateValueAndValidity());
    }
  }

  private resetForm() {
    removeAllFormArrayControls(this.form);
  }

  private createForm() {
    const options: SelectConstraintOption[] = this.options?.length
      ? this.options
      : (this.uniqueValues || []).slice(0, MAX_PREDEFINED_VALUES).map(value => ({value}));
    options.map((option, index) => this.createOptionForm(index, option)).forEach(form => this.form.push(form));
    const optionsLength = options.length;
    this.form.push(this.createOptionForm(optionsLength));

    if (this.form.length < 2) {
      this.form.push(this.createOptionForm(optionsLength + 1));
    }
  }

  public onAddOption() {
    this.form.push(this.createOptionForm(this.form.controls.length));
  }

  public onRemoveOption(index: number) {
    this.form.removeAt(index);
  }

  public onDrop(event: CdkDragDrop<string[]>) {
    moveFormArrayItem(this.form, event.previousIndex, event.currentIndex);
  }

  public onValueInput(event: Event, index: number) {
    const value = event.target['value'];

    if (index === this.form.controls.length - 1 && value) {
      this.form.push(this.createOptionForm(this.form.controls.length));
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

  private createOptionForm(index: number, option?: SelectConstraintOption): FormGroup {
    const initialBackground = selectDefaultPalette[index % selectDefaultPalette.length];
    return new FormGroup(
      {
        [SelectConstraintOptionsFormControl.Value]: new FormControl(unescapeHtml(option?.value || '')),
        [SelectConstraintOptionsFormControl.DisplayValue]: new FormControl(unescapeHtml(option?.displayValue || '')),
        [SelectConstraintOptionsFormControl.Background]: new FormControl(option?.background || initialBackground),
      },
      this.createRequiredValueValidator()
    );
  }

  private createRequiredValueValidator(): ValidatorFn {
    return (formGroup: FormGroup): ValidationErrors | null => {
      const valueControl = formGroup.get(SelectConstraintOptionsFormControl.Value);
      const displayValueControl = formGroup.get(SelectConstraintOptionsFormControl.DisplayValue);
      return this.displayValues && displayValueControl.value && !valueControl.value && valueControl.value !== 0
        ? {required: true}
        : null;
    };
  }

  public onColorSave(optionIndex: number, color: string) {
    this.patchBackground(optionIndex, color);
  }

  private patchBackground(optionIndex: number, color: string) {
    this.form.at(optionIndex).patchValue({[SelectConstraintOptionsFormControl.Background]: color});
  }

  public onPaletteClick(optionIndex: number, colorPicker: ColorPickerComponent) {
    this.backgroundInitialValues[optionIndex] = this.form
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
}
