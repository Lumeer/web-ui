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
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {ConstraintType, CoordinatesDataValue} from '@lumeer/data-filters';

import {KeyCode, keyboardEventCode} from '../../key-code';
import {checkDataInputElementValue, isElementActive, setCursorAtDataInputEnd} from '../../utils/html-modifier';
import {CommonDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';

@Component({
  selector: 'coordinates-data-input',
  templateUrl: './coordinates-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatesDataInputComponent implements AfterViewChecked, OnChanges {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: CoordinatesDataValue;

  @Input()
  public fontColor: string;

  @Output()
  public valueChange = new EventEmitter<CoordinatesDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: CoordinatesDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('coordinatesInput')
  public coordinatesInput: ElementRef<HTMLInputElement>;

  public readonly inputClass = constraintTypeClass(ConstraintType.Coordinates);

  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private setFocus: boolean;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.setFocus = true;
      this.preventSave = false;
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.value && this.value) {
      if (this.readonly) {
        checkDataInputElementValue(this.coordinatesInput?.nativeElement, this.value);
      }
    }
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  public setFocusToInput() {
    if (this.coordinatesInput) {
      setCursorAtDataInputEnd(this.coordinatesInput.nativeElement, this.value);
    }
  }

  private addKeyDownListener() {
    this.removeKeyDownListener();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);
  }

  private removeKeyDownListener() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.removeKeyDownListener();

    if (this.preventSave) {
      this.preventSave = false;
    } else {
      const dataValue = this.value.parseInput(this.coordinatesInput.nativeElement.value);
      this.save.emit({action: DataInputSaveAction.Blur, dataValue});
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          return;
        }
        // needs to be executed after parent event handlers
        const input = this.coordinatesInput;
        const dataValue = this.value.parseInput(input.nativeElement.value);

        event.preventDefault();

        this.preventSaveAndBlur();
        this.saveDataValue(dataValue, event);
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.cancel.emit();
        return;
    }
  }

  private saveDataValue(dataValue: CoordinatesDataValue, event: KeyboardEvent) {
    const action = keyboardEventInputSaveAction(event);
    if (this.commonConfiguration?.delaySaveAction) {
      // needs to be executed after parent event handlers
      setTimeout(() => this.save.emit({action, dataValue}));
    } else {
      this.save.emit({action, dataValue});
    }
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.coordinatesInput?.nativeElement)) {
      this.preventSave = true;
      this.coordinatesInput.nativeElement.blur();
      this.removeKeyDownListener();
    }
  }

  public onFocus() {
    this.addKeyDownListener();
  }
}
