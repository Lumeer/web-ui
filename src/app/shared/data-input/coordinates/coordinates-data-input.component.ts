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
  HostListener,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {CoordinatesDataValue} from '../../../core/model/data-value/coordinates.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';

@Component({
  selector: 'coordinates-data-input',
  templateUrl: './coordinates-data-input.component.html',
  styleUrls: ['./coordinates-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinatesDataInputComponent {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: CoordinatesDataValue;

  @Output()
  public valueChange = new EventEmitter<CoordinatesDataValue>();

  @Output()
  public save = new EventEmitter<CoordinatesDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('coordinatesInput', {static: false})
  public coordinatesInput: ElementRef<HTMLInputElement>;

  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        const input = this.coordinatesInput;
        HtmlModifier.setCursorAtTextContentEnd(input.nativeElement);
        input.nativeElement.focus();
      });
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.saveValue(this.coordinatesInput);
    }
    this.dataBlur.emit();
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        // needs to be executed after parent event handlers
        const input = this.coordinatesInput;
        this.preventSave = true;
        setTimeout(() => input && this.saveValue(input));
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.coordinatesInput.nativeElement.value = this.value.format();
        this.cancel.emit();
        return;
    }
  }

  private saveValue(input: ElementRef) {
    const dataValue = this.value.parseInput(input.nativeElement.value);
    this.save.emit(dataValue);
  }
}
