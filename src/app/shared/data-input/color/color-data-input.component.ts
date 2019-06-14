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
import {ColorConstraintConfig} from '../../../core/model/data/constraint';
import {formatColorDataValue, isColorValid} from '../../utils/data.utils';
import {HtmlModifier} from '../../utils/html-modifier';
import {KeyCode} from '../../key-code';
import {ColorPickerDirective} from 'ngx-color-picker';
import {greyscale, palette, saturated} from '../../picker/color-picker/colors';

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

  @Input()
  public skipValidation: boolean;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('colorInput', {static: false})
  public colorInput: ElementRef<HTMLInputElement>;

  public valid = true;
  public dialogVisible = false;
  private preventSaving: boolean;
  private preventClosing = false;

  public readonly localPalette = [...greyscale, '#ffffff', ...saturated, ...palette];

  @ViewChild(ColorPickerDirective, {static: false})
  private colorPicker: ColorPickerDirective;

  private refreshValid(value: any) {
    this.valid = !value || isColorValid(value, this.constraintConfig);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.preventClosing = true;
      this.preventSaving = !!changes.value;
      setTimeout(() => {
        this.refreshValid(this.value);

        if (changes.value) {
          this.colorInput.nativeElement.value = formatColorDataValue(this.value, this.constraintConfig, false);
        }

        HtmlModifier.setCursorAtTextContentEnd(this.colorInput.nativeElement);
        this.colorInput.nativeElement.focus();
      });
      setTimeout(() => {
        this.preventClosing = false;
      }, 200);
    }
    if (changes.focus && !this.focus) {
      this.closeColorPicker();
    }
    if (changes.value && String(this.value).length === 1) {
      // show value entered into hidden input without any changes
      const input = this.colorInput;
      setTimeout(() => input && (input.nativeElement.value = this.value));
    }

    this.refreshValid(this.value);
  }

  private openColorPicker() {
    this.colorPicker.openDialog();
  }

  private closeColorPicker() {
    if (this.colorPicker) {
      this.colorPicker.closeDialog();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.colorInput;

        if (input) {
          if (
            !this.skipValidation &&
            input.nativeElement.value &&
            !isColorValid(input.nativeElement.value, this.constraintConfig)
          ) {
            event.stopImmediatePropagation();
            event.preventDefault();
            return;
          }

          this.preventSaving = true;
          const value = this.transformValue(input.nativeElement.value);
          // needs to be executed after parent event handlers
          setTimeout(() => this.save.emit(value));
        }
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
    }
  }

  public onInput(value: string) {
    this.value = this.transformValue(value);
    this.refreshValid(value);
    this.valueChange.emit(value);
  }

  public onValueChange(color: string) {
    if (this.preventClosing) {
      this.preventClosing = false;
      return;
    }

    if (this.preventSaving) {
      this.preventSaving = false;
      return;
    }

    if (!color) {
      this.cancel.emit();
      return;
    }

    this.value = this.transformValue(color);
    this.refreshValid(this.value);

    this.save.emit(this.value);

    this.closeColorPicker();
    this.colorInput.nativeElement.blur();
  }

  public onBlur() {
    if (this.preventSaving) {
      this.preventSaving = false;
    } else {
      this.save.emit(this.transformValue(this.colorInput.nativeElement.value));
    }
  }

  private transformValue(value: string): string {
    return formatColorDataValue(value, this.constraintConfig);
  }

  public onTextInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.onInput(element.value);
  }

  public onDialogDisplay(visible: boolean) {
    if (!visible && !this.readonly && this.preventClosing) {
      this.openColorPicker();
    }
    this.dialogVisible = visible;
  }

  public onCancel() {
    this.preventSaving = true;
    this.colorInput.nativeElement.value = formatColorDataValue(this.value, this.constraintConfig, false);
    this.cancel.emit();
  }
}
