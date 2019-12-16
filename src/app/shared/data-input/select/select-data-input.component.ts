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
import {SelectDataValue} from '../../../core/model/data-value/select.data-value';
import {SelectConstraintConfig} from '../../../core/model/data/constraint-config';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {isArray} from '../../utils/common.utils';

@Component({
  selector: 'select-data-input',
  templateUrl: './select-data-input.component.html',
  styleUrls: ['./select-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDataInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: SelectDataValue;

  @Output()
  public valueChange = new EventEmitter<SelectDataValue>();

  @Output()
  public save = new EventEmitter<SelectDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public options: DropdownOption[] = [];
  public selectedOptions: DropdownOption[] = [];

  public text = '';

  private setFocus: boolean;
  private triggerInput: boolean;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      this.text = this.value.format();
      this.triggerInput = true;
      this.options = this.createDropdownOptions(this.value.config);
      this.selectedOptions = this.createSelectedOptions(this.value.config);
    }
  }

  private createDropdownOptions(config: SelectConstraintConfig): DropdownOption[] {
    return config.options.map(option => ({
      ...option,
      value: String(option.value || ''),
      displayValue: String((config.displayValues && option.displayValue) || option.value || ''),
    }));
  }

  private createSelectedOptions(config: SelectConstraintConfig): DropdownOption[] {
    if (isArray(this.value.value)) {
      return [];
    }
    return this.value.value;
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
    if (this.triggerInput) {
      this.dispatchInputEvent();
      this.triggerInput = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
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

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          return;
        }
        const selectedOption = this.dropdown.getActiveOption();
        this.preventSaveAndBlur();
        // needs to be executed after parent event handlers
        setTimeout(() => this.saveValue(selectedOption, true));
        return;
      case KeyCode.Escape:
        this.resetSearchInput();
        this.cancel.emit();
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  public onInput() {
    const dataValue = this.value.parseInput(this.text);
    this.valueChange.emit(dataValue);
  }

  private saveValue(activeOption: DropdownOption, enter?: boolean) {
    if (activeOption) {
      const selectedOption = this.options.find(option => option.value === activeOption.value);
      const dataValue = this.value.copy(selectedOption ? selectedOption.value : '');
      this.save.emit(dataValue);
    } else {
      if (enter) {
        this.enterInvalid.emit();
      } else {
        this.cancel.emit();
      }
    }

    this.resetSearchInput();
  }

  private resetSearchInput() {
    this.text = '';
  }

  public onSelect(option: DropdownOption) {
    this.preventSaveAndBlur();
    this.saveValue(option);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      this.saveValue(this.dropdown && this.dropdown.getActiveOption());
    }
  }

  private preventSaveAndBlur() {
    if (this.textInput) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onFocused() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }
}
