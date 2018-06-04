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

import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

import {Subject} from 'rxjs';
import {AbstractControl, FormGroup} from '@angular/forms';
import {KeyCode} from '../../../key-code';
import {getCaretCharacterOffsetWithin, HtmlModifier} from '../../../utils/html-modifier';
import {AttributeQueryItem} from '../model/attribute.query-item';

@Component({
  selector: 'attribute-condition',
  templateUrl: './attribute-condition.component.html',
  styleUrls: ['./attribute-condition.component.scss']
})
export class AttributeConditionComponent implements OnInit {

  @Input()
  public queryItem: AttributeQueryItem;

  @Input()
  public readonly: boolean;

  @Input()
  public queryItemForm: FormGroup;

  @Output()
  public enter = new EventEmitter();

  @Output()
  public moveRight = new EventEmitter();

  @ViewChild('conditionInput')
  private conditionInput: ElementRef;

  public focused: boolean;

  public moveSuggestionSelection$ = new Subject<number>();
  public useSuggestionSelection$ = new Subject<string>();

  public ngOnInit() {
    if (!this.readonly && this.conditionControl && !this.conditionControl.valid) {
      this.focusInput();
    }
  }

  public get conditionControl(): AbstractControl {
    return this.queryItemForm && this.queryItemForm.get('condition');
  }

  public onInput(value: string) {
    this.setValue(value);
  }

  private setValue(value: string) {
    this.conditionControl.setValue(value);
    this.queryItem.condition = value;
  }

  public onFocus() {
    this.focused = true;
  }

  public onBlur() {
    this.focused = false;
    this.setValue(this.queryItem.condition.trim());
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.DownArrow:
      case KeyCode.UpArrow:
        this.onUpAndDownArrowKeysDown(event);
        break;
      case KeyCode.RightArrow:
        this.onRightArrowKeyDown();
        break;
      case KeyCode.Enter:
        event.preventDefault();
        break;
      case KeyCode.Escape:
        this.onEscapeKeyDown();
        break;
    }
  }

  public onUpAndDownArrowKeysDown(event: KeyboardEvent) {
    event.preventDefault();
    const direction = event.keyCode === KeyCode.UpArrow ? -1 : 1;
    this.moveSuggestionSelection$.next(direction);
  }

  public onEnterKeyUp() {
    const value = this.queryItem.condition.trim();
    this.useSuggestionSelection$.next(value);
  }

  public onUseSuggestion(condition: string) {
    this.setValue(condition);
    this.enter.emit();
  }

  public focusInput() {
    setTimeout(() => HtmlModifier.setCursorAtTextContentEnd(this.conditionInput.nativeElement));
  }

  private onRightArrowKeyDown() {
    const inputLength = this.queryItem.condition.length;
    const caretOffset = getCaretCharacterOffsetWithin(this.conditionInput.nativeElement);
    if (caretOffset >= inputLength) {
      this.moveRight.emit();
    }
  }

  private onEscapeKeyDown() {
    this.conditionInput.nativeElement.blur();
  }
}
