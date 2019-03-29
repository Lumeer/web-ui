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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  SimpleChanges,
  HostListener,
  OnChanges,
} from '@angular/core';
import {ColorConstraintConfig, DateTimeConstraintConfig} from '../../../core/model/data/constraint';
import {BsDatepickerDirective} from 'ngx-bootstrap';
import {
  formatColorDataValue,
  formatDateTimeDataValue,
  getDateTimeSaveValue,
  parseDateTimeDataValue,
} from '../../utils/data.utils';
import {HtmlModifier} from '../../utils/html-modifier';
import {KeyCode} from '../../key-code';

@Component({
  selector: 'color-data-input',
  templateUrl: './color-data-input.component.html',
  styleUrls: ['./color-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorDataInputComponent implements OnChanges {
  @Input()
  public constraintConfig: ColorConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('colorInput')
  public colorInput: ElementRef<HTMLInputElement>;

  private preventSaving: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.preventSaving = !!changes.value;
      setTimeout(() => {
        if (changes.value) {
          this.colorInput.nativeElement.value = formatColorDataValue(this.value, this.constraintConfig, false);
        }

        HtmlModifier.setCursorAtTextContentEnd(this.colorInput.nativeElement);
        this.colorInput.nativeElement.focus();
        this.openColorPicker();
      });
    }
    if (changes.focus && !this.focus) {
      this.closeColorPicker();
    }
    if (changes.value && String(this.value).length === 1) {
      // show value entered into hidden input without any changes
      const input = this.colorInput;
      setTimeout(() => input && (input.nativeElement.value = this.value));
    }
  }

  private openColorPicker() {
    //    (this.colorInput as any).spectrum({});
  }

  private closeColorPicker() {
    //  (this.colorInput as any).spectrum({});
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.colorInput) {
          this.preventSaving = true;
          const value = this.transformValue(this.colorInput.nativeElement.value);
          // needs to be executed after parent event handlers
          setTimeout(() => this.save.emit(value));
        }
        return;
      case KeyCode.Escape:
        this.preventSaving = true;
        this.colorInput.nativeElement.value = formatColorDataValue(this.value, this.constraintConfig, false);
        this.cancel.emit();
        return;
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.valueChange.emit(element.value);
  }

  public onValueChange(color: string) {
    if (this.preventSaving) {
      this.preventSaving = false;
      return;
    }

    if (!color) {
      this.cancel.emit();
      return;
    }

    const previousColor = formatColorDataValue(this.value, this.constraintConfig);
    const value = color || '';

    if (value !== previousColor) {
      this.save.emit(value);
    }
  }

  private transformValue(value: string): string {
    return formatColorDataValue(value, this.constraintConfig);
  }
}
