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
import {PercentageDataValue} from '../../../core/model/data-value/percentage.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {ConstraintType} from '../../../core/model/data/constraint';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';

@Component({
  selector: 'percentage-data-input',
  templateUrl: './percentage-data-input.component.html',
  styleUrls: ['./percentage-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentageDataInputComponent implements OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: PercentageDataValue;

  @Input()
  public skipValidation: boolean;

  @Output()
  public valueChange = new EventEmitter<PercentageDataValue>();

  @Output()
  public save = new EventEmitter<PercentageDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('percentageInput')
  public percentageInput: ElementRef<HTMLInputElement>;

  public readonly inputClass = constraintTypeClass(ConstraintType.Percentage);

  public valid = true;
  public percentageValue: any;

  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        HtmlModifier.setCursorAtTextContentEnd(this.percentageInput.nativeElement);
        this.percentageInput.nativeElement.focus();
      });
    }
    this.valid = !this.value || this.value.isValid();
    this.percentageValue = this.value && this.value.format('');
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

        const input = this.percentageInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);

        event.preventDefault();

        if (!this.skipValidation && input && !dataValue.isValid()) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        // needs to be executed after parent event handlers
        setTimeout(() => input && this.save.emit(dataValue));
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }
  }

  private preventSaveAndBlur() {
    if (this.percentageInput) {
      this.preventSave = true;
      this.percentageInput.nativeElement.blur();
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.valid = dataValue.isValid();

    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      const dataValue = this.value.parseInput(this.percentageInput.nativeElement.value);
      if (this.skipValidation || dataValue.isValid()) {
        this.save.emit(dataValue);
      } else {
        this.cancel.emit();
      }
    }
  }
}
