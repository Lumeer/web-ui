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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {NumberConstraintConfig} from '../../../core/model/data/constraint';
import {HtmlModifier} from '../../utils/html-modifier';
import {KeyCode} from '../../key-code';
import {PercentageValidPipe} from './percentage-valid.pipe';

@Component({
  selector: 'percentage-data-input',
  templateUrl: './percentage-data-input.component.html',
  styleUrls: ['./percentage-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PercentageDataInputComponent implements OnChanges {
  @Input()
  public constraintConfig: NumberConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<number | string>();

  @Output()
  public save = new EventEmitter<number | string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('percentageInput')
  public percentageInput: ElementRef<HTMLInputElement>;

  private preventSave: boolean;

  constructor(private percentageValid: PercentageValidPipe) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      setTimeout(() => {
        HtmlModifier.setCursorAtTextContentEnd(this.percentageInput.nativeElement);
        this.percentageInput.nativeElement.focus();
      });
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const input = this.percentageInput;

        if (!this.percentageValid.transform(input)) {
          event.stopPropagation();
          return;
        }

        // needs to be executed after parent event handlers
        setTimeout(() => {
          this.preventSave = true;
          this.save.emit(this.transformValue(input.nativeElement.value));
        });
        return;
      case KeyCode.Escape:
        this.preventSave = true;
        this.percentageInput.nativeElement.value = this.value || '';
        this.cancel.emit();
        return;
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const value = this.transformValue(element.value);
    this.valueChange.emit(value);
  }

  public onBlur() {
    if (this.preventSave) {
      this.preventSave = false;
    } else {
      this.save.emit(this.transformValue(this.percentageInput.nativeElement.value));
    }
  }

  private transformValue(value: any): number | string {
    const text = String(value).trim();
    if (text.endsWith('%')) {
      const prefix = text.substring(0, text.length - 1);
      if (!isNaN(+prefix)) {
        return Number(prefix) / 100;
      }
    } else {
      if (!isNaN(+value)) {
        return Number(value) / 100;
      }
    }

    return String(value);
  }
}
