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
import {DateTimeConstraintConfig} from '../../../core/model/data/constraint';
import {HtmlModifier} from '../../utils/html-modifier';
import {BsDatepickerDirective} from 'ngx-bootstrap';
import {KeyCode} from '../../key-code';
import * as moment from 'moment';
import {formatDateTimeDataValue, parseDateTimeDataValue} from '../../utils/data.utils';

@Component({
  selector: 'datetime-data-input',
  templateUrl: './datetime-data-input.component.html',
  styleUrls: ['./datetime-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeDataInputComponent implements OnChanges {
  @Input()
  public constraintConfig: DateTimeConstraintConfig;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<string>();

  @Output()
  public save = new EventEmitter<string>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('dateInput')
  public dateInput: ElementRef<HTMLInputElement>;

  @ViewChild(BsDatepickerDirective)
  public datePicker: BsDatepickerDirective;

  private preventSaving: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      this.preventSaving = !!changes.value;
      const input = this.dateInput;
      setTimeout(() => {
        if (changes.value) {
          input.nativeElement.value = formatDateTimeDataValue(this.value, this.constraintConfig, false);
        }
        HtmlModifier.setCursorAtTextContentEnd(input.nativeElement);
        input.nativeElement.focus();
        this.datePicker.show();
      });
    }
    if (changes.focus && !this.focus) {
      if (this.datePicker) {
        this.datePicker.hide();
      }
    }
    if (changes.value && String(this.value).length === 1) {
      // show value entered into hidden input without any changes
      const input = this.dateInput;
      setTimeout(() => (input.nativeElement.value = this.value));
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        this.preventSaving = true;
        const value = this.transformValue(this.dateInput.nativeElement.value);
        // needs to be executed after parent event handlers
        setTimeout(() => this.save.emit(value));
        return;
      case KeyCode.Escape:
        this.preventSaving = true;
        this.dateInput.nativeElement.value = formatDateTimeDataValue(this.value, this.constraintConfig, false);
        this.cancel.emit();
        return;
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    this.valueChange.emit(element.value);
  }

  public onValueChange(date: Date) {
    if (this.preventSaving) {
      this.preventSaving = false;
      return;
    }

    if (date && !(date instanceof Date)) {
      this.cancel.emit();
      return;
    }

    const previousDate = parseDateTimeDataValue(this.value, this.constraintConfig.format);
    const previousValue = previousDate && previousDate.toISOString();
    const value = date && date.toISOString();

    if (value !== previousValue) {
      this.save.emit(value);
    }
  }

  private transformValue(value: string): string {
    return value ? moment(value, this.constraintConfig.format).toISOString() : '';
  }
}
