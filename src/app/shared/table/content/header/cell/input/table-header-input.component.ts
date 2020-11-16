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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnChanges,
  AfterViewChecked,
} from '@angular/core';
import {HtmlModifier} from '../../../../../utils/html-modifier';
import {
  filterOutInvalidAttributeNameCharacters,
  FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS,
} from '../../../../../utils/attribute.utils';
import {KeyCode} from '../../../../../key-code';
import {preventEvent} from '../../../../../utils/common.utils';
import {TableColumn} from '../../../../model/table-column';

@Component({
  selector: 'table-header-input',
  templateUrl: './table-header-input.component.html',
  styleUrls: ['./table-header-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeaderInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public column: TableColumn;

  @Input()
  public restrictedNames: string[];

  @Input()
  public default: boolean;

  @Input()
  public edited: boolean;

  @Input()
  public offsetHorizontal: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  private preventSave: boolean;
  private setFocus: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.edited && this.edited) {
      this.setFocus = true;
    }
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      if (this.isNameValid()) {
        this.saveValue();
      } else {
        this.textInput.nativeElement.value = this.value;
      }
    }
  }

  public onInput(event: Event) {
    const eventValue = String(event.target['value'] || '');
    const value = filterOutInvalidAttributeNameCharacters(eventValue);
    this.valueChange.emit(eventValue);

    if (eventValue !== value) {
      this.textInput.nativeElement.value = value;
    }
  }

  public onPaste(event: Event) {
    event.preventDefault();

    const clipboardData: DataTransfer = event['clipboardData'] || window['clipboardData'];
    const clipboardValue = clipboardData.getData('text/plain');
    const safeValue = filterOutInvalidAttributeNameCharacters(clipboardValue);

    const {selectionStart, selectionEnd, value} = this.textInput.nativeElement;
    const prefix = value.slice(0, selectionStart);
    const suffix = value.slice(selectionEnd);

    this.valueChange.emit(prefix + safeValue + suffix);
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.isNameValid()) {
          this.preventSaveAndBlur();
          this.saveValue();
          event.preventDefault();
        } else {
          preventEvent(event);
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        event.preventDefault();
        event.stopPropagation();
        return;
      case KeyCode.ArrowUp:
      case KeyCode.ArrowDown:
        event.preventDefault();
        return;
    }

    if (FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS.includes(event.key)) {
      event.preventDefault();
    }
  }

  private isNameValid(): boolean {
    const value = this.textInput.nativeElement.value?.trim() || '';
    return value && !(this.restrictedNames || []).includes(value);
  }

  public preventSaveAndBlur() {
    if (this.textInput) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  private saveValue() {
    const value = this.textInput.nativeElement?.value?.trim();
    this.save.emit(value);
  }
}
