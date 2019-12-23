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
import {ColorDataValue} from '../../../core/model/data-value/color.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {ColorPickerComponent} from '../../picker/color/color-picker.component';
import {isNotNullOrUndefined} from '../../utils/common.utils';

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
  public enterInvalid = new EventEmitter();

  @ViewChild('colorInput', {static: false})
  public colorInput: ElementRef<HTMLInputElement>;

  @ViewChild(ColorPickerComponent, {static: false})
  public colorPicker: ColorPickerComponent;

  public valid = true;

  private pendingUpdate: string;

  constructor(public element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      setTimeout(() => {
        HtmlModifier.setCursorAtTextContentEnd(this.colorInput.nativeElement);
        this.colorInput.nativeElement.focus();
        this.openColorPicker();
      });
    }
    if (this.changedFromEditableToReadonly(changes)) {
      if (isNotNullOrUndefined(this.pendingUpdate)) {
        this.onSave(this.pendingUpdate);
      }
    }

    if (changes.focus && !this.focus) {
      this.closeColorPicker();
    }
    this.refreshValid(this.value);
  }

  private changedFromEditableToReadonly(changes: SimpleChanges): boolean {
    return (
      changes.readonly &&
      isNotNullOrUndefined(changes.readonly.previousValue) &&
      !changes.readonly.previousValue &&
      this.readonly
    );
  }

  private refreshValid(value: ColorDataValue) {
    this.valid = value.isValid() || !value.format();
  }

  private openColorPicker() {
    this.pendingUpdate = null;
    this.colorPicker.open();
  }

  private closeColorPicker() {
    if (this.colorPicker) {
      this.colorPicker.close();
    }
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

        const input = this.colorInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);
        this.pendingUpdate = null;

        event.stopImmediatePropagation();
        event.preventDefault();

        if (!this.skipValidation && input.nativeElement.value && !dataValue.isValid()) {
          this.enterInvalid.emit();
          return;
        }

        // needs to be executed after parent event handlers
        setTimeout(() => this.save.emit(dataValue));
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
    }
  }

  public onValueChange(value: string) {
    this.pendingUpdate = value;
    this.colorInput.nativeElement.value = value;
    const dataValue = this.value.parseInput(value);
    this.valueChange.emit(dataValue);
  }

  public onSave(color: string) {
    const value = this.value.copy(color);
    if (color && !value.isValid()) {
      this.cancel.emit();
      return;
    }

    this.pendingUpdate = null;
    this.value = value;
    this.colorInput && (this.colorInput.nativeElement.value = '');
    this.save.emit(value);
  }

  public onSaveOnClose(color: string) {
    this.onSave(color);
  }

  public onCancel() {
    this.pendingUpdate = null;
    this.cancel.emit();
  }

  public onInput(value: string) {
    this.onValueChange(value);
  }
}
