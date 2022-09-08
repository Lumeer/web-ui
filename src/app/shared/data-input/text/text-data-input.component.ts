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
import {keyboardEventCode, KeyCode} from '../../key-code';
import {isElementActive, setCursorAtDataInputEnd} from '../../utils/html-modifier';
import {DataSuggestion} from '../data-suggestion';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {ConstraintType, DataValue, TextDataValue, UnknownDataValue} from '@lumeer/data-filters';

@Component({
  selector: 'text-data-input',
  templateUrl: './text-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextDataInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public configuration: CommonDataInputConfiguration;

  @Input()
  public value: TextDataValue | UnknownDataValue;

  @Input()
  public placeholder: string;

  @Input()
  public fontColor: string;

  @Input()
  public suggestions: DataSuggestion[];

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: DataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Text);

  public text = '';
  public valid = true;

  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private setFocus: boolean;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.setFocus = true;
      this.preventSave = false;
      this.text = this.value.editValue();
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.value && this.value) {
      this.text = this.value.editValue();
    }

    this.refreshValid(this.value);
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.textInput) {
      setCursorAtDataInputEnd(this.textInput.nativeElement, this.value);
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

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.text = element.value;
    const dataValue = this.value.parseInput(element.value);
    this.refreshValid(dataValue);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.removeKeyDownListener();

    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const selectedOption = this.dropdown?.getActiveOption();
      let dataValue = this.value.parseInput(this.text);
      if (selectedOption || this.configuration?.skipValidation || dataValue.isValid()) {
        if (selectedOption) {
          dataValue = this.value.parseInput(selectedOption.value);
        }
        this.save.emit({action: DataInputSaveAction.Blur, dataValue});
      } else {
        this.cancel.emit();
      }
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  private refreshValid(value: DataValue) {
    this.valid = !value || value.isValid();
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.textInput;
        let dataValue = this.value.parseInput(input.nativeElement.value);
        const selectedOption = this.dropdown?.getActiveOption();

        event.preventDefault();

        if (!this.configuration?.skipValidation && !dataValue.isValid() && !selectedOption) {
          event.stopImmediatePropagation();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        dataValue = selectedOption ? this.value.parseInput(selectedOption.displayValue) : dataValue;
        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }

    this.dropdown?.onKeyDown(event);
  }

  private saveDataValue(dataValue: DataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.configuration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.textInput?.nativeElement)) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
      this.removeKeyDownListener();
    }
  }

  public onSelectOption(option: DropdownOption) {
    this.preventSaveAndBlur();
    const dataValue = this.value.parseInput(option.value);
    this.save.emit({action: DataInputSaveAction.Select, dataValue});
  }

  public onFocused() {
    this.addKeyDownListener();
    this.dropdown?.open();
  }
}
