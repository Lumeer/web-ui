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
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {KeyCode} from '../../../../../../../shared/key-code';
import {
  filterOutInvalidAttributeNameCharacters,
  FORBIDDEN_ATTRIBUTE_NAME_CHARACTERS,
} from '../../../../../../../shared/utils/attribute.utils';
import {HtmlModifier} from '../../../../../../../shared/utils/html-modifier';

@Component({
  selector: 'table-column-input',
  templateUrl: './table-column-input.component.html',
  styleUrls: ['./table-column-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableColumnInputComponent implements OnChanges {
  @Input()
  public default: boolean;

  @Input()
  public edited: boolean;

  @Input()
  public initialized: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.edited && this.edited) {
      setTimeout(() => this.focusInput());
    }
  }

  private focusInput() {
    const element = this.textInput && (this.textInput.nativeElement as HTMLElement);
    if (element) {
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue();
    }
  }

  public onInput(event: Event) {
    const value = event.target['value'] || '';
    this.valueChange.emit(value.trim());
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
        this.preventSaveAndBlur();
        this.saveValue();
        event.preventDefault();
        return;
      case KeyCode.Escape:
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

  public preventSaveAndBlur() {
    if (this.textInput) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  private saveValue() {
    const {value} = this.textInput.nativeElement;
    this.save.emit(value);
  }
}
