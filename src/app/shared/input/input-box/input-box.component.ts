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
import {Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, ViewChild} from '@angular/core';

import {I18n} from '@ngx-translate/i18n-polyfill';

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
export class InputBoxComponent implements OnInit {
  @ViewChild('input') public input: ElementRef;
  @ViewChild('inputParent') public inputParent: ElementRef;

  @Input() public initialValue: string;
  @Input() public color: string;
  @Input() public fontSizeRem: number;
  @Input() public paddingRem: number;
  @Input() public canStayEmpty: boolean;
  @Input() public maxLines: number;
  @Input() public placeholder: string;
  @Input() public title: string;
  @Input() public editable: boolean = true;
  @Input() public emitAllChanges: boolean = false;
  @Input() public userData: boolean = false;
  @Input() public alwaysFrame: boolean = false;
  @Input() public textAttribute: boolean = false;
  @Input() public innerClass: string = '';

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

  public constructor(private i18n: I18n) {}

  public ngOnInit() {
    this.computeProperties();
  }

  public ngOnChanges(changes: {[propertyName: string]: SimpleChange}) {
    this.computeProperties();
  }

  private computeProperties() {
    this.mCurrentValue = (this.initialValue && this.initialValue.trim()) || '';
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

  public onNewValue(value: string) {
    this.blur.emit();
    this.removeFocusFromInputParent();

    if (value !== this.mCurrentValue) {
      if (value.length === 0 && !this.canStayEmpty) {
        this.emptyValue.emit();
        this.input.nativeElement.textContent = this.mCurrentValue;
      } else {
        this.mCurrentValue = value;
        this.newValue.emit(value);
      }
    }
  }

  public setValue(value: string) {
    this.mCurrentValue = value;
  }

  public onFocus() {
    this.focus.emit(this.mCurrentValue);
    this.addFocusToInputParent();
  }

  public addFocusToInputParent() {
    this.inputParent.nativeElement.classList.add('focused');
  }

  public removeFocusFromInputParent() {
    this.inputParent.nativeElement.classList.remove('focused');
  }

  public setWarningBorder() {
    this.input.nativeElement.classList.add(...warningStyle);
  }

  public removeWarningBorder() {
    this.input.nativeElement.classList.remove(...warningStyle);
  }

  private defaultPlaceholder() {
    return this.i18n({
      id: 'inputBox.placeholder.default',
      value: 'Write text here...',
    });
  }

  public onInterimNewValue(textContent: string | null) {
    if (this.emitAllChanges) {
      this.newValue.emit(textContent);
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    this.keyDown.emit(event);
  }

  public onEnter() {
    this.enter.emit();
  }
}
