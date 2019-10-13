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
import {ColorPickerDirective} from 'ngx-color-picker';
import {ColorDataValue} from '../../../core/model/data-value/color.data-value';
import {KeyCode} from '../../key-code';
import {greyscale, palette, saturated} from '../../picker/icon-color/color/colors';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'color-data-input',
  templateUrl: './color-data-input.component.html',
  styleUrls: ['./color-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorDataInputComponent implements OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: ColorDataValue;

  @Input()
  public skipValidation: boolean;

  @Output()
  public valueChange = new EventEmitter<ColorDataValue>();

  @Output()
  public save = new EventEmitter<ColorDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

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
    this.valid = !value || this.value.copy(value).isValid();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.preventClosing = true;
      this.preventSaving = !!changes.value;
      setTimeout(() => {
        this.refreshValid(this.value);

        if (changes.value) {
          this.colorInput.nativeElement.value = this.value.format();
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
    if (changes.value && this.value.format().length === 1) {
      // show value entered into hidden input without any changes
      const input = this.colorInput;
      setTimeout(() => input && (input.nativeElement.value = this.value.format()));
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
          const dataValue = this.value.parseInput(input.nativeElement.value);

          if (!this.skipValidation && input.nativeElement.value && !dataValue.isValid()) {
            event.stopImmediatePropagation();
            event.preventDefault();
            return;
          }

          this.preventSaving = true;
          // needs to be executed after parent event handlers
          setTimeout(() => this.save.emit(dataValue));
        }
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
    }
  }

  public onInput(value: string) {
    const dataValue = this.value.parseInput(value);
    this.valueChange.emit(dataValue);
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


    const dataValue = this.value.copy(color);
    this.save.emit(dataValue);

    this.closeColorPicker();
    this.colorInput.nativeElement.blur();
  }

  public onBlur() {
    if (this.preventSaving) {
      this.preventSaving = false;
    } else {
      const {value} = this.colorInput.nativeElement;
      const dataValue = this.value.parseInput(value);
      this.save.emit(dataValue);
    }
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
    this.colorInput && (this.colorInput.nativeElement.value = this.value.format());
    this.cancel.emit();
  }
}
