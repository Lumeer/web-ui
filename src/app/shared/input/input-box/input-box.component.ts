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
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  ViewChild,
} from '@angular/core';

const DEFAULT_FONT_SIZE = 1;
const DEFAULT_MAX_LINES = -1;
const DEFAULT_LINE_HEIGHT = 1.5;
const DEFAULT_PADDING_H = 0.5;
const DEFAULT_PADDING_V = 0.375;
const warningStyle = ['border', 'border-danger', 'rounded'];

@Component({
  selector: 'input-box',
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss'],
})
export class InputBoxComponent implements OnInit, OnChanges {
  @ViewChild('input', {static: true}) public input: ElementRef<HTMLDivElement>;
  @ViewChild('inputParent', {static: true}) public inputParent: ElementRef;

  @Input() public initialValue: string;
  @Input() public color: string;
  @Input() public fontSizeRem: number;
  @Input() public paddingRem: number;
  @Input() public canStayEmpty: boolean;
  @Input() public maxLines: number;
  @Input() public placeholder: string;
  @Input() public title: string;
  @Input() public editable: boolean = true;
  @Input() public emitAllChanges: boolean;
  @Input() public userData: boolean;
  @Input() public alwaysFrame: boolean;
  @Input() public textAttribute: boolean;
  @Input() public innerClass: string = '';
  @Input() public filter: RegExp;
  @Input() public maxLength = 0;

  @Output() public focus: EventEmitter<string> = new EventEmitter();
  @Output() public blur: EventEmitter<void> = new EventEmitter();
  @Output() public newValue: EventEmitter<string> = new EventEmitter();
  @Output() public emptyValue: EventEmitter<void> = new EventEmitter();
  @Output() public enter = new EventEmitter();
  @Output() public keyDown = new EventEmitter<KeyboardEvent>();

  public mCurrentValue: string;
  public mFontSizeRem: number;
  public mPlaceholder: string;
  public mLineHeight: number;
  public mPaddingHRem: number;
  public mPaddingVRem: number;
  public mMaxHeightRem: number;

  public ngOnInit() {
    this.computeProperties();
  }

  public ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    this.computeProperties();
  }

  public get inputElement(): HTMLDivElement {
    return this.input?.nativeElement;
  }

  private computeProperties() {
    this.mCurrentValue = (this.initialValue && this.initialValue.toString().trim()) || '';
    this.mFontSizeRem = this.fontSizeRem || DEFAULT_FONT_SIZE;
    const mMaxLines = this.maxLines || DEFAULT_MAX_LINES;
    this.mLineHeight = DEFAULT_LINE_HEIGHT;
    this.mPaddingVRem = this.paddingRem || DEFAULT_PADDING_V;
    this.mPaddingHRem = DEFAULT_PADDING_H;
    if (mMaxLines === 1) {
      this.mMaxHeightRem = mMaxLines * this.mLineHeight * this.mFontSizeRem + 2 * this.mPaddingVRem;
    } else {
      this.mMaxHeightRem = 9999; // unlimited
    }
    this.mPlaceholder = this.placeholder || this.defaultPlaceholder();
  }

  private filterValue(value: string): string {
    if (this.filter) {
      value = value.replace(this.filter, '');
    }

    return value;
  }

  public onNewValue(value: string) {
    const oldValue = value;
    value = this.filterValue(value);

    if (this.maxLength && value.length > this.maxLength) {
      value = value.substring(0, this.maxLength);
    }

    this.blur.emit();
    this.removeFocusFromInputParent();

    if (value !== this.mCurrentValue) {
      const element = this.input.nativeElement;

      if (value.length === 0 && !this.canStayEmpty) {
        this.emptyValue.emit();
        element.textContent = this.mCurrentValue;
      } else {
        this.mCurrentValue = value;
        this.newValue.emit(value);
        const caret = this.getCaret(element);
        element.textContent = value;
        if (oldValue.length !== value.length) {
          this.setCaret(element, caret - (oldValue.length - value.length));
        }
      }
    }
  }

  private setCaret(el: HTMLElement, caret: number) {
    if (el.childNodes.length > 0 && el.nodeType === Node.ELEMENT_NODE) {
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(el.childNodes[0], caret);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      el.focus();
    }
  }

  private getCaret(el: HTMLElement): number {
    if (el.nodeType === Node.ELEMENT_NODE) {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(el);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    }
  }

  public setValue(value: string) {
    this.mCurrentValue = this.filterValue(value);
    setTimeout(() => this.inputElement && (this.inputElement.textContent = value));
  }

  public onFocus() {
    this.focus.emit(this.mCurrentValue);
    this.addFocusToInputParent();
  }

  public addFocusToInputParent() {
    this.inputParent?.nativeElement?.classList.add('focused');
  }

  public removeFocusFromInputParent() {
    this.inputParent?.nativeElement?.classList.remove('focused');
  }

  public setWarningBorder() {
    this.inputElement.classList.add(...warningStyle);
  }

  public removeWarningBorder() {
    this.inputElement.classList.remove(...warningStyle);
  }

  private defaultPlaceholder() {
    return $localize`:@@inputBox.placeholder.default:Write text here...`;
  }

  public onInterimNewValue(textContent: string | null) {
    let value = this.filterValue(textContent);

    if (this.maxLength && value.length > this.maxLength) {
      value = value.substring(0, this.maxLength);
    }

    const element = this.input.nativeElement;
    if (this.emitAllChanges) {
      this.newValue.emit(value);
    }

    if (textContent !== value) {
      const caret = this.getCaret(element);
      element.textContent = value;
      this.setCaret(element, caret - (textContent.length - value.length));
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    this.keyDown.emit(event);
  }

  public onEnter() {
    this.enter.emit();
  }

  public pasteContent($event: ClipboardEvent) {
    $event.preventDefault();
    const data = $event.clipboardData.getData('text/plain').replace(/\n/g, '');
    document.execCommand('insertText', false, data);
  }
}
