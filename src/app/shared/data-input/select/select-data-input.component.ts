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
import {Store} from '@ngrx/store';
import {TypeaheadDirective, TypeaheadMatch} from 'ngx-bootstrap';
import {Subscription} from 'rxjs';
import {take} from 'rxjs/operators';
import {SelectConstraintConfig, SelectConstraintOption} from '../../../core/model/data/constraint-config';
import {User} from '../../../core/store/users/user';
import {KeyCode} from '../../key-code';
import {formatSelectDataValue, formatUserDataValue, isSelectDataValueValid} from '../../utils/data.utils';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'select-data-input',
  templateUrl: './select-data-input.component.html',
  styleUrls: ['./select-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectDataInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public constraintConfig: SelectConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(TypeaheadDirective, {static: false})
  public typeahead: TypeaheadDirective;

  public options: SelectConstraintOption[] = [];

  public text = '';

  public valid = true;

  private preventSave: boolean;
  private setFocus: boolean;
  private triggerInput: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value) {
      if (this.value && String(this.value).length === 1) {
        this.text = this.value;
        this.triggerInput = true; // show suggestions when typing the first letter in readonly mode
      }
    }
    if (changes.constraintConfig && this.constraintConfig) {
      this.options = this.createDisplayOptions(this.constraintConfig);
    }
    if (changes.value || changes.constraintConfig) {
      this.valid = isSelectDataValueValid(this.value, this.constraintConfig);
    }
  }

  private createDisplayOptions(config: SelectConstraintConfig): SelectConstraintOption[] {
    return config.options.map(option => ({
      ...option,
      displayValue: (config.displayValues && option.displayValue) || option.value,
    }));
  }

  public ngAfterViewChecked(): void {
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
        this.preventSave = true;
        // needs to be executed after parent event handlers
        setTimeout(() => this.saveValue());
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.resetSearchInput();
        this.cancel.emit();
        return;
    }
  }

  private saveValue() {
    const selectedOption = this.options.find(option => option.displayValue === this.text);

    if (selectedOption || !this.text) {
      this.save.emit(selectedOption ? selectedOption.value : '');
    }
    this.resetSearchInput();
  }

  private resetSearchInput() {
    this.text = ''; // formatSelectDataValue(this.value, this.constraintConfig);
  }

  public onSelect(event: TypeaheadMatch) {
    this.preventSave = true;
    this.save.emit(event.item.value);
  }

  public onBlur() {
    this.cancel.emit();
  }
}
