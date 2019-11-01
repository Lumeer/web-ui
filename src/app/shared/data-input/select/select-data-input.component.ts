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
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead';
import {SelectDataValue} from '../../../core/model/data-value/select.data-value';
import {SelectConstraintConfig, SelectConstraintOption} from '../../../core/model/data/constraint-config';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';

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
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  public options: SelectConstraintOption[] = [];

  public text = '';

  private setFocus: boolean;
  private triggerInput: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      if (String(this.value.format()).length === 1) {
        this.text = this.value.format();
        this.triggerInput = true; // show suggestions when typing the first letter in readonly mode
      }
      this.options = this.createDisplayOptions(this.value.config);
    }
  }

  private createDisplayOptions(config: SelectConstraintConfig): SelectConstraintOption[] {
    return config.options.map(option => ({
      ...option,
      displayValue: (config.displayValues && option.displayValue) || option.value,
    }));
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
        // needs to be executed after parent event handlers
        setTimeout(() => this.saveValue());
        return;
      case KeyCode.Escape:
        this.resetSearchInput();
        this.cancel.emit();
        return;
    }
  }

  public onInput() {
    const dataValue = this.value.parseInput(this.text);
    this.valueChange.emit(dataValue);
  }

  private saveValue() {
    const selectedOption = this.options.find(option => option.displayValue === this.text);

    if (selectedOption || !this.text) {
      const dataValue = this.value.copy(selectedOption ? selectedOption.value : '');
      this.save.emit(dataValue);
    }
    this.resetSearchInput();
  }

  private resetSearchInput() {
    this.text = ''; // formatSelectDataValue(this.value, this.constraintConfig);
  }

  public onSelect(event: TypeaheadMatch) {
    const dataValue = this.value.copy(event.item.value);
    this.save.emit(dataValue);
  }

  public onBlur() {
    this.cancel.emit();
    this.dataBlur.emit();
  }
}
