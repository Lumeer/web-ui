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
import {HtmlModifier, isElementActive} from '../../utils/html-modifier';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {uniqueValues} from '../../utils/array.utils';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration, SelectDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {BehaviorSubject} from 'rxjs';
import {ConstraintType, SelectConstraintConfig, SelectConstraintOption, SelectDataValue} from '@lumeer/data-filters';

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
  public configuration: SelectDataInputConfiguration;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: SelectDataValue;

  @Output()
  public valueChange = new EventEmitter<SelectDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: SelectDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('wrapperElement')
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly inputClass = constraintTypeClass(ConstraintType.Select);

  public dropdownOptions: DropdownOption[] = [];
  public selectedOptions$ = new BehaviorSubject<SelectConstraintOption[]>([]);

  public multi: boolean;
  public text = '';

  private setFocus: boolean;
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private mouseDownListener: (event: MouseEvent) => void;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.addListeners();
      this.resetSearchInput();
      this.setFocus = true;
      this.preventSave = false;
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.value && this.value) {
      this.selectedOptions$.next(this.value.options || []);
      this.dropdownOptions = this.createDropdownOptions(this.value.config);
      this.text = this.value.inputValue || '';
      this.multi = this.value.config?.multi;
    }
  }

  private addListeners() {
    this.removeListeners();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);

    this.mouseDownListener = event => this.onMouseDown(event);
    this.element.nativeElement.addEventListener('mousedown', this.mouseDownListener);
  }

  private removeListeners() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;

    if (this.mouseDownListener) {
      this.element.nativeElement.removeEventListener('mousedown', this.mouseDownListener);
    }
    this.mouseDownListener = null;
  }

  private createDropdownOptions(config: SelectConstraintConfig): DropdownOption[] {
    const options = [...(config?.options || [])];
    const optionsValues = new Set(options.map(option => option.value));
    (this.value?.options || []).forEach(option => {
      if (!optionsValues.has(option.value)) {
        options.push(option);
        optionsValues.add(option.value);
      }
    });

    const invalidValues = this.value?.constraintData?.invalidValuesMap?.[ConstraintType.Select];
    invalidValues?.forEach(value => {
      if (!optionsValues.has(value)) {
        options.push({value});
        optionsValues.add(value);
      }
    });
    return options.map(option => ({
      ...option,
      value: option.value,
      displayValue: config.displayValues ? option.displayValue || option.value : option.value,
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

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const selectedOption = this.dropdown?.getActiveOption();

        event.preventDefault();

        if (this.multi && keyboardEventCode(event) !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
        } else {
          this.preventSaveAndBlur();

          const action = keyboardEventInputSaveAction(event);
          if (this.commonConfiguration?.delaySaveAction) {
            // needs to be executed after parent event handlers
            setTimeout(() => this.saveValue(action, selectedOption));
          } else {
            this.saveValue(action, selectedOption);
          }
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.text && this.multi && this.selectedOptions$.value.length > 0) {
          this.selectedOptions$.next(this.selectedOptions$.value.slice(0, this.selectedOptions$.value.length - 1));
        }
        return;
    }

    this.dropdown?.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedOptions$.value.some(o => o.value === option.value)) {
      this.selectedOptions$.next(this.selectedOptions$.value.filter(o => o.value !== option.value));
    } else {
      const selectOption = (this.dropdownOptions || []).find(o => o.value === option.value);
      if (selectOption) {
        const displayValues = this.value.config.displayValues;
        const newOption = displayValues ? selectOption : {...selectOption, displayValue: selectOption.value};
        this.selectedOptions$.next([...this.selectedOptions$.value, newOption]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();

    const optionValues = uniqueValues(this.selectedOptions$.value.map(selectedOption => selectedOption.value));
    const dataValue = this.value.copy(optionValues);
    this.valueChange.emit(dataValue);
  }

  public onInput() {
    const dataValue = this.value.parseInput(this.text);
    this.valueChange.emit(dataValue);
  }

  private saveValue(action: DataInputSaveAction, activeOption?: DropdownOption) {
    if (this.multi) {
      const selectedOption =
        activeOption && this.value.config.options.find(option => option.value === activeOption.value);
      const options = [...this.selectedOptions$.value, selectedOption].filter(option => !!option);
      const optionValues = uniqueValues(options.map(option => option.value));
      const dataValue = this.value.copy(optionValues);
      this.save.emit({action, dataValue});
      return;
    }

    if (activeOption || !this.text) {
      const dataValue = this.value.copy(activeOption ? activeOption.value : '');
      this.save.emit({action, dataValue});
    } else {
      if (action === DataInputSaveAction.Enter) {
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
      this.dropdown?.resetActiveOption();
    } else {
      this.preventSaveAndBlur();
      this.saveValue(DataInputSaveAction.Select, option);
    }
  }

  public onBlur() {
    this.removeListeners();
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else if (this.multi) {
      this.saveValue(DataInputSaveAction.Blur);
    } else if (this.dropdown?.getActiveOption()) {
      this.saveValue(DataInputSaveAction.Blur, this.dropdown.getActiveOption());
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.textInput?.nativeElement)) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
      this.removeListeners();
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

  private onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  public trackByOption(index: number, option: SelectConstraintOption): string {
    return option.value;
  }
}
