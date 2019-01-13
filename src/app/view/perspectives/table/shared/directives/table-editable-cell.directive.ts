/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {KeyCode} from '../../../../../shared/key-code';
import {HtmlModifier} from '../../../../../shared/utils/html-modifier';

@Directive({
  selector: '[tableEditableCell]',
  host: {
    '[attr.spellcheck]': 'false',
    '[attr.tabindex]': 'selected ? 1 : null',
    '[attr.contenteditable]': '!readonly',
    '[attr.disabled]': '!edited',
    '[class.affected]': 'affected && !selected',
    '[class.selected]': 'selected',
    '[class.edited]': 'edited',
    '[style.cursor]': `edited ? 'text' : null`,
    '[textContent]': 'value',
    '[title]': `value ? value : ''`,
    '[class.editable-cell]': 'true',
    '[class.h-100]': 'true',
    '[class.p-1]': 'true',
    '[class.text-nowrap]': 'true',
    '[class.overflow-hidden]': 'true',
  },
})
export class TableEditableCellDirective implements OnChanges {
  @Input()
  public affected: boolean;

  @Input()
  public cancelOnBlur: boolean;

  @Input()
  public disabledCharacters: string[];

  @Input()
  public readonly: boolean = true;

  @Input()
  public selected: boolean;

  @Input()
  public value: string;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public editStart = new EventEmitter();

  @Output()
  public editEnd = new EventEmitter<string>();

  @Output()
  public editKeyDown = new EventEmitter<KeyboardEvent>();

  public edited: boolean;

  public constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected && this.selected) {
      setTimeout(() => {
        const element = this.element.nativeElement as HTMLElement;
        if (document.activeElement !== element) {
          element.focus();
          HtmlModifier.setCursorAtTextContentEnd(element);
        }
      });
    }
  }

  @HostListener('blur')
  public onBlur() {
    this.stopEditing(this.cancelOnBlur);
  }

  @HostListener('dblclick')
  public onDoubleClick() {
    this.startEditing();
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (this.edited) {
      this.onKeyDownInEditMode(event);
    }
  }

  private onKeyDownInEditMode(event: KeyboardEvent) {
    event.stopPropagation();

    this.editKeyDown.emit(event);

    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        this.stopEditing();
        event.preventDefault();
        return;
      case KeyCode.Escape:
        this.stopEditing(true);
        event.preventDefault();
        return;
      case KeyCode.ArrowUp:
      case KeyCode.ArrowDown:
        event.preventDefault();
        return;
    }

    if (this.isCharacterDisabled(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  public onInput(event: Event) {
    const value = event.target['innerText'] || '';
    this.valueChange.emit(value.trim());
  }

  @HostListener('paste', ['$event'])
  public onPaste(event: KeyboardEvent) {
    event.preventDefault();

    const clipboardData: DataTransfer = event['clipboardData'] || window['clipboardData'];
    const value = clipboardData.getData('text/plain');

    document.execCommand('insertHTML', false, value);
  }

  public startEditing(clear?: boolean) {
    if (this.edited || this.readonly) {
      return;
    }

    this.edited = true;

    const element = this.element.nativeElement as HTMLElement;

    if (clear) {
      element.textContent = '';
    }

    this.editStart.emit();
    setTimeout(() => {
      element.scrollLeft = element.scrollWidth - element.clientWidth + 5;
      HtmlModifier.setCursorAtTextContentEnd(element);
    });
  }

  private stopEditing(cancel?: boolean) {
    if (!this.edited || this.readonly) {
      return;
    }

    this.edited = false;

    const element = this.element.nativeElement as HTMLElement;
    if (cancel) {
      element.textContent = this.value;
      this.valueChange.emit(this.value);
      this.editEnd.emit();
    } else {
      const value = element.textContent;
      this.editEnd.emit(value);
    }

    element.scrollLeft = 0;
  }

  private isCharacterDisabled(character: string): boolean {
    return this.disabledCharacters && this.disabledCharacters.includes(character);
  }

  public setValue(value: string) {
    const element = this.element.nativeElement as HTMLElement;
    element.textContent = this.value = value;
  }
}
