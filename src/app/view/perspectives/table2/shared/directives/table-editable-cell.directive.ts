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

import {Directive, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges} from '@angular/core';
import {KeyCode} from '../../../../../shared/key-code';
import {HtmlModifier} from '../../../../../shared/utils/html-modifier';

@Directive({
  selector: '[tableEditableCell]',
  host: {
    '[attr.spellcheck]': 'false',
    '[attr.tabindex]': 'selected ? 1 : null',
    '[attr.contenteditable]': 'edited',
    '[class.affected]': 'affected && !selected',
    '[class.selected]': 'selected',
    '[class.edited]': 'edited',
    '[style.cursor]': `edited ? 'text' : 'default'`,
    '[textContent]': 'value',
    '[title]': `value ? value : ''`,
    '[class.editable-cell]': 'true',
    '[class.h-100]': 'true',
    '[class.p-1]': 'true',
    '[class.text-nowrap]': 'true',
    '[class.overflow-hidden]': 'true'
  }
})
export class TableEditableCellDirective {

  @Input()
  public affected: boolean;

  @Input()
  public readonly: boolean;

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

  public edited: boolean;

  public constructor(private element: ElementRef) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected) {
      if (!this.selected) {
        this.edited = false;
      }
    }
  }

  @HostListener('blur')
  public onBlur() {
    this.stopEditing();
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
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.F2:
        this.stopEditing();
        event.preventDefault();
        return;
      case KeyCode.Escape:
        this.stopEditing(true);
        event.preventDefault();
        return;
    }
  }

  @HostListener('input', ['$event'])
  public onInput(event: KeyboardEvent) {
    const value = event.target['innerText'];
    this.valueChange.emit(value);
  }

  @HostListener('edit', ['$event'])
  public onEdit(letter?: string) {
    this.startEditing(letter);
  }

  public startEditing(letter?: string) {
    if (this.edited || this.readonly) {
      return;
    }

    this.edited = true;

    const element = this.element.nativeElement;
    if (letter) {
      element.textContent = letter;
    }

    this.editStart.emit();
    setTimeout(() => HtmlModifier.setCursorAtTextContentEnd(this.element.nativeElement));
  }

  private stopEditing(cancel?: boolean) {
    if (!this.edited || this.readonly) {
      return;
    }

    this.edited = false;

    if (cancel) {
      this.element.nativeElement.textContent = this.value;
      this.valueChange.emit(this.value);
      this.editEnd.emit();
    } else {
      const value = this.element.nativeElement.textContent;
      this.editEnd.emit(value);
    }
  }

}
