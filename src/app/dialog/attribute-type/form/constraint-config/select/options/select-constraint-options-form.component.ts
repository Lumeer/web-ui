/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {take} from 'rxjs/operators';
import {SelectConstraintOption} from '../../../../../../core/model/data/constraint';
import {moveFormArrayItem, removeAllFormArrayControls} from '../../../../../../shared/utils/form.utils';
import {SelectConstraintOptionsFormControl} from '../select-constraint-form-control';

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

  @ViewChildren('valueInput')
  public valueInputs: QueryList<ElementRef<HTMLInputElement>>;

  public readonly formControlNames = SelectConstraintOptionsFormControl;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.resetForm();
      this.createForm();
    }
  }

  private resetForm() {
    removeAllFormArrayControls(this.form);
  }

  private createForm() {
    (this.options || [])
      .map(option => createOptionForm(option.value, option.displayValue))
      .forEach(form => this.form.push(form));

    if (this.form.length < 2) {
      this.form.push(createOptionForm());
      this.form.push(createOptionForm());
    }
  }

  public onAddOption() {
    this.form.push(createOptionForm());
  }

  public onRemoveOption(index: number) {
    this.form.removeAt(index);
  }

  public onDrop(event: CdkDragDrop<string[]>) {
    moveFormArrayItem(this.form, event.previousIndex, event.currentIndex);
  }

  public onEnterKeyDown(event: KeyboardEvent, index: number) {
    event.preventDefault();
    this.form.insert(index + 1, createOptionForm());
    this.valueInputs.changes.pipe(take(1)).subscribe((valueInputs: QueryList<ElementRef<HTMLInputElement>>) => {
      const element = valueInputs.toArray()[index + 1];
      if (element) {
        element.nativeElement.focus();
      }
    });
  }
}

function createOptionForm(value = '', displayValue = ''): FormGroup {
  return new FormGroup({
    [SelectConstraintOptionsFormControl.Value]: new FormControl(value, Validators.required),
    [SelectConstraintOptionsFormControl.DisplayValue]: new FormControl(displayValue),
  });
}
