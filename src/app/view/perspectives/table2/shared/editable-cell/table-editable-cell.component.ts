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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {KeyCode} from '../../../../../shared/key-code';
import {HtmlModifier} from '../../../../../shared/utils/html-modifier';
import {isKeyPrintable} from '../../../../../shared/utils/key-code.helper';

@Component({
  selector: 'table-editable-cell',
  templateUrl: './table-editable-cell.component.html',
  styleUrls: ['./table-editable-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableEditableCellComponent implements OnChanges {

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

  @ViewChild('editableCell')
  public editableCell: ElementRef;

  public edited: boolean;

  public constructor(private changeDetector: ChangeDetectorRef) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('selected')) {
      if (this.selected) {
        this.editableCell.nativeElement.focus();
      } else {
        this.edited = false; // TODO maybe save changes
      }
    }
  }

  public onBlur() {
    this.stopEditing();
  }

  public onDoubleClick() {
    this.startEditing();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (this.edited) {
      this.onKeyDownInEditMode(event);
    } else {
      this.onKeyDownInSelectionMode(event);
    }
  }

  private onKeyDownInEditMode(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.Escape:
        this.stopEditing();
        event.preventDefault();
        return;
      case KeyCode.UpArrow:
      case KeyCode.DownArrow:
      case KeyCode.LeftArrow:
      case KeyCode.RightArrow:
        event.stopPropagation();
        return;
    }
  }

  private onKeyDownInSelectionMode(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
      case KeyCode.Backspace:
        this.startEditing();
        event.preventDefault();
        return;
      case KeyCode.Delete:
        // this.showRemoveConfirm();
        return;
      default:
        if (!isKeyPrintable(event.keyCode)) {
          return;
        }

        event.preventDefault();
        this.startEditing();
        const element = this.editableCell.nativeElement;
        if (!element.textContent) {
          element.textContent = event.key;
        }
    }
  }

  public onInput(event: KeyboardEvent) {
    const value = event.target['innerText'];
    this.valueChange.emit(value);
  }

  public startEditing() {
    if (this.edited || this.readonly) {
      return;
    }

    this.edited = true;
    this.changeDetector.detectChanges();

    this.editStart.emit();
    setTimeout(() => HtmlModifier.setCursorAtTextContentEnd(this.editableCell.nativeElement));
  }

  private stopEditing() {
    if (!this.edited || this.readonly) {
      return;
    }

    this.edited = false;

    const value = this.editableCell.nativeElement.textContent;
    this.editEnd.emit(value);

    this.changeDetector.detectChanges(); // TODO maybe not needed
  }

}
