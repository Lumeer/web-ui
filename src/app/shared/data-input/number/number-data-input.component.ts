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
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {NumberDataValue} from '../../../core/model/data-value/number.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {ConstraintType} from '../../../core/model/data/constraint';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';

@Component({
  selector: 'number-data-input',
  templateUrl: './number-data-input.component.html',
  styleUrls: ['./number-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberDataInputComponent implements OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: NumberDataValue;

  @Input()
  public skipValidation: boolean;

  @Output()
  public valueChange = new EventEmitter<NumberDataValue>();

  @Output()
  public save = new EventEmitter<NumberDataValue>();

  @Output()
  public enterInvalid = new EventEmitter();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('numberInput', {static: false})
  public numberInput: ElementRef<HTMLInputElement>;

  public readonly inputClass = constraintTypeClass(ConstraintType.Number);

  public valid = true;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        HtmlModifier.setCursorAtTextContentEnd(this.numberInput.nativeElement);
        this.numberInput.nativeElement.focus();
      });
    }
    this.refreshValid(this.value);
  }

  private refreshValid(value: NumberDataValue) {
    this.valid = !value || value.isValid();
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          return;
        }
        const input = this.numberInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);

        event.preventDefault();

        if (!this.skipValidation && !dataValue.isValid()) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        // needs to be executed after parent event handlers
        setTimeout(() => this.save.emit(dataValue));
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }
  }

  private preventSaveAndBlur() {
    if (this.numberInput) {
      this.preventSave = true;
      this.numberInput.nativeElement.blur();
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.refreshValid(dataValue);

    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      const dataValue = this.value.parseInput(this.numberInput.nativeElement.value);
      if (this.skipValidation || dataValue.isValid()) {
        this.save.emit(dataValue);
      } else {
        this.cancel.emit();
      }
    }
  }
}
