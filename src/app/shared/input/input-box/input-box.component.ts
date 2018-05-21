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
import {Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChange, ViewChild} from "@angular/core";

import {I18n} from '@ngx-translate/i18n-polyfill';

const DEFAULT_FONT_SIZE = 1;
const DEFAULT_MAX_LINES = 1;
const DEFAULT_LINE_HEIGHT = 1.5;
const DEFAULT_PADDING = 0.5;
const warningStyle = ['border', 'border-danger', 'rounded'];

@Component({
  selector: 'input-box',
  templateUrl: './input-box.component.html',
  styleUrls: ['./input-box.component.scss']
})
export class InputBoxComponent implements OnInit {

  @ViewChild('input') public input: ElementRef;
  @ViewChild('inputParent') public inputParent: ElementRef;

  @Input() public initialValue: string;
  @Input() public color: string;
  @Input() public fontSizeRem: number;
  @Input() public paddingRem: number;
  @Input() public maxLines: number;
  @Input() public canStayEmpty: boolean;
  @Input() public placeholder: string;
  @Input() public title: string;
  @Input() public editable: boolean = true;
  @Input() public emitAllChanges: boolean = false;

  @Output() public focus: EventEmitter<void> = new EventEmitter();
  @Output() public blur: EventEmitter<void> = new EventEmitter();
  @Output() public newValue: EventEmitter<string> = new EventEmitter();
  @Output() public emptyValue: EventEmitter<void> = new EventEmitter();

  public mCurrentValue: string;
  public mFontSizeRem: number;
  public mMaxHeightRem: number;
  public mPlaceholder: string;
  public mLineHeight: number;
  public mPaddingRem: number;

  public constructor(private i18n: I18n) {
  }

  public ngOnInit() {
    this.computeProperties();
  }

  public ngOnChanges(changes: { [propertyName: string]: SimpleChange }) {
    this.computeProperties();
  }

  private computeProperties() {
    this.mCurrentValue = this.initialValue && this.initialValue.trim() || '';
    this.mFontSizeRem = this.fontSizeRem || DEFAULT_FONT_SIZE;
    const mMaxLines = this.maxLines || DEFAULT_MAX_LINES;
    this.mLineHeight = DEFAULT_LINE_HEIGHT;
    this.mPaddingRem = this.isMultiLine() ? this.paddingRem || DEFAULT_PADDING : 0;
    this.mMaxHeightRem = mMaxLines * DEFAULT_LINE_HEIGHT * this.mFontSizeRem;
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

  public setValue(value: string){
    this.mCurrentValue = value;
  }

  public onFocus() {
    this.focus.emit();
    this.addFocusToInputParent();
  }

  public addFocusToInputParent() {
    this.inputParent.nativeElement.classList.add('focused');
  }

  public removeFocusFromInputParent() {
    this.inputParent.nativeElement.classList.remove('focused');
  }

  public isMultiLine(): boolean {
    return this.maxLines > 1;
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
      value: 'Write text here...'
    });
  }

  public onInterimNewValue(textContent: string | null) {
    if (this.emitAllChanges) {
      this.onNewValue(textContent);
    }
  }
}
