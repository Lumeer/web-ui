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
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {DataValue} from '../../../core/model/data-value';
import {TextDataValue} from '../../../core/model/data-value/text.data-value';
import {UnknownDataValue} from '../../../core/model/data-value/unknown.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {DataSuggestion} from '../data-suggestion';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';

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
  public skipValidation: boolean;

  @Input()
  public value: TextDataValue | UnknownDataValue;

  @Input()
  public placeholder: string;

  @Input()
  public suggestions: DataSuggestion[];

  @Output()
  public valueChange = new EventEmitter<DataValue>();

  @Output()
  public save = new EventEmitter<DataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public text = '';
  public valid = true;

  private preventSave: boolean;
  private triggerInput: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        const input = this.textInput;
        HtmlModifier.setCursorAtTextContentEnd(input.nativeElement);
        input.nativeElement.focus();
      });
      this.triggerInput = true;
      this.text = this.value.format();
    }
    if (changes.value && this.value) {
      this.text = this.value.format();
    }

    this.refreshValid(this.value);
  }

  public ngAfterViewChecked() {
    if (this.triggerInput) {
      this.dispatchInputEvent();
      this.triggerInput = false;
    }
  }

  private dispatchInputEvent() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      setTimeout(() => element.dispatchEvent(event));
    }
  }

  public onInput() {
    const dataValue = this.value.parseInput(this.text);
    this.refreshValid(dataValue);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const selectedOption = this.dropdown.getActiveOption();
      const dataValue = this.value.parseInput(this.text);
      if (selectedOption || this.skipValidation || dataValue.isValid()) {
        if (selectedOption) {
          this.saveValue(selectedOption.value);
        } else {
          this.save.emit(dataValue);
        }
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

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          return;
        }
        const input = this.textInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);
        const selectedOption = this.dropdown.getActiveOption();

        if (!this.skipValidation && !dataValue.isValid() && !selectedOption) {
          event.stopImmediatePropagation();
          event.preventDefault();
          this.enterInvalid.emit();
          return;
        }

        this.preventSaveAndBlur();
        // needs to be executed after parent event handlers
        setTimeout(() => {
          if (selectedOption) {
            this.saveValue(selectedOption.value);
          } else {
            this.save.emit(dataValue);
          }
        });
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private preventSaveAndBlur() {
    if (this.textInput) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  private saveValue(value: string) {
    const dataValue = this.value.parseInput(value);
    this.save.emit(dataValue);
  }

  public onSelectOption(option: DropdownOption) {
    this.preventSaveAndBlur();
    this.saveValue(option.value);
  }

  public onFocused() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }
}
