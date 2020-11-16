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
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {ColorDataValue} from '../../../core/model/data-value/color.data-value';
import {KeyCode} from '../../key-code';
import {ColorPickerComponent} from '../../picker/color/color-picker.component';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {ConstraintType} from '../../../core/model/data/constraint';
import {COLOR_SUCCESS} from '../../../core/constants';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'color-data-input',
  templateUrl: './color-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorDataInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: ColorDataValue;

  @Input()
  public configuration: CommonDataInputConfiguration;

  @Output()
  public valueChange = new EventEmitter<ColorDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: ColorDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('colorInput')
  public colorInput: ElementRef<HTMLInputElement>;

  @ViewChild(ColorPickerComponent)
  public colorPicker: ColorPickerComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Color);
  public readonly defaultColor = COLOR_SUCCESS;

  public valid = true;

  private pendingUpdate: string;
  private keyDownListener: (event: KeyboardEvent) => void;
  private setFocus: boolean;

  constructor(public element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.setFocus = true;
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

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.openColorPicker();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.colorInput) {
      const element = this.colorInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  private addKeyDownListener() {
    this.removeKeyDownListener();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);
  }

  private removeKeyDownListener() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
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

  private onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.colorInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);
        this.pendingUpdate = null;

        event.preventDefault();

        if (!this.configuration?.skipValidation && input.nativeElement.value && !dataValue.isValid()) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.onCancel();
        return;
    }
  }

  private saveDataValue(dataValue: ColorDataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.configuration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  public onValueChange(value: string) {
    this.pendingUpdate = value;
    this.colorInput.nativeElement.value = value;
    const dataValue = this.value.parseInput(value);
    this.valueChange.emit(dataValue);
  }

  public onSave(color: string) {
    const dataValue = this.value.copy(color);
    if (color && !dataValue.isValid()) {
      this.cancel.emit();
      return;
    }

    this.pendingUpdate = null;
    this.value = dataValue;
    this.colorInput && (this.colorInput.nativeElement.value = '');
    this.save.emit({action: DataInputSaveAction.Button, dataValue});
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

  public onBlur() {
    this.removeKeyDownListener();
  }

  public onFocus() {
    this.addKeyDownListener();
  }
}
