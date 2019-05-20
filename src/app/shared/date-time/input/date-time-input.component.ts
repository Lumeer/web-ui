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
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {parseDateTimeDataValue} from '../../utils/data.utils';
import {resetUnusedDatePart} from '../../utils/date.utils';
import {createDateTimeOptions, DateTimeOptions} from '../date-time-options';
import {DateTimePickerComponent} from '../picker/date-time-picker.component';

@Component({
  selector: 'date-time-input',
  templateUrl: './date-time-input.component.html',
  styleUrls: ['./date-time-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimeInputComponent implements OnChanges {
  @Input()
  public format: string;

  @Input()
  public id: string;

  @Input()
  public min: Date;

  @Input()
  public max: Date;

  @Input()
  public readonly: boolean;

  @Input()
  public value: Date;

  @Output()
  public valueChange = new EventEmitter<Date>();

  @ViewChild('dateTimeInput')
  public dateTimeInput: ElementRef<HTMLInputElement>;

  @ViewChild(DateTimePickerComponent)
  public dateTimePicker: DateTimePickerComponent;

  public options: DateTimeOptions;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.format && this.format) {
      this.options = createDateTimeOptions(this.format);
    }
  }

  public onFocus() {
    this.dateTimePicker.open();
  }

  public onClickOutside() {
    this.dateTimePicker.close();
  }

  public onBlur() {
    if (this.dateTimeInput) {
      const value = parseDateTimeDataValue(this.dateTimeInput.nativeElement.value, this.format);
      this.valueChange.emit(value);
    }
  }

  public onSave(date: Date) {
    this.valueChange.emit(resetUnusedDatePart(date, this.format));
  }
}
