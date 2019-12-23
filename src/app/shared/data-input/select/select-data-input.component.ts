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
import {SelectConstraintConfig, SelectConstraintOption} from '../../../core/model/data/constraint-config';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {uniqueValues} from '../../utils/array.utils';

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

  @ViewChild('wrapperElement', {static: false})
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public dropdownOptions: DropdownOption[] = [];
  public selectedOptions: SelectConstraintOption[] = [];

  public multi: boolean;
  public text = '';

  private setFocus: boolean;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      this.dropdownOptions = this.createDropdownOptions(this.value.config);
      this.selectedOptions = this.value.options;
      this.text = this.value.inputValue || '';
      this.multi = this.value.config && this.value.config.multi;
    }
  }

  private createDropdownOptions(config: SelectConstraintConfig): DropdownOption[] {
    return config.options.map(option => ({
      ...option,
      value: String(option.value || ''),
      displayValue: String((config.displayValues && option.displayValue) || option.value || ''),
    }));
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
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

        event.preventDefault();
        event.stopImmediatePropagation();

        if (this.multi && event.code !== KeyCode.Tab && selectedOption) {
          this.toggleOption(selectedOption);
          this.dropdown.resetActiveOption();
        } else {
          this.preventSaveAndBlur();
          // needs to be executed after parent event handlers
          setTimeout(() => this.saveValue(selectedOption, event.code !== KeyCode.Tab));
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.text && this.multi && this.selectedOptions.length > 0) {
          this.selectedOptions = this.selectedOptions.slice(0, this.selectedOptions.length - 1);
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedOptions.some(o => o.value === option.value)) {
      this.selectedOptions = this.selectedOptions.filter(o => o.value !== option.value);
    } else {
      const selectOption = (this.value.config.options || []).find(o => o.value === option.value);
      if (selectOption) {
        this.selectedOptions = [...this.selectedOptions, selectOption];
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();
  }

  public onInput() {
    const dataValue = this.value.parseInput(this.text);
    this.valueChange.emit(dataValue);
  }

  private saveValue(activeOption: DropdownOption, enter?: boolean) {
    if (this.multi) {
      const selectedOption =
        activeOption && this.value.config.options.find(option => option.value === activeOption.value);
      const options = [...this.selectedOptions, selectedOption].filter(option => !!option);
      const optionValues = uniqueValues(options.map(option => option.value));
      const dataValue = this.value.copy(optionValues);
      this.save.emit(dataValue);
      return;
    }

    if (activeOption) {
      const dataValue = this.value.copy(activeOption.value || '');
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
    if (this.multi) {
      this.toggleOption(option);
    } else {
      this.preventSaveAndBlur();
      this.saveValue(option);
    }
  }

  public onBlur() {
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const activeOption = this.multi ? null : this.dropdown && this.dropdown.getActiveOption();
      this.saveValue(activeOption);
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
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

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (!this.readonly && this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  public trackByOption(index: number, option: SelectConstraintOption): string {
    return option.value;
  }
}
