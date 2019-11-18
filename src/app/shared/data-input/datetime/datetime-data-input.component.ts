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
  AfterViewInit,
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
import {environment} from '../../../../environments/environment';
import {DateTimeDataValue} from '../../../core/model/data-value/datetime.data-value';
import {createDateTimeOptions, DateTimeOptions} from '../../date-time/date-time-options';
import {DateTimePickerComponent} from '../../date-time/picker/date-time-picker.component';
import {KeyCode} from '../../key-code';
import {isDateValid} from '../../utils/common.utils';
import {HtmlModifier} from '../../utils/html-modifier';
import {DataValueInputType} from '../../../core/model/data-value';

@Component({
  selector: 'datetime-data-input',
  templateUrl: './datetime-data-input.component.html',
  styleUrls: ['./datetime-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeDataInputComponent implements OnChanges, AfterViewInit {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: DateTimeDataValue;

  @Output()
  public onFocus = new EventEmitter<any>();

  @Output()
  public valueChange = new EventEmitter<DateTimeDataValue>();

  @Output()
  public save = new EventEmitter<DateTimeDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('dateTimeInput', {static: true})
  public dateTimeInput: ElementRef<HTMLInputElement>;

  @ViewChild(DateTimePickerComponent, {static: false})
  public dateTimePicker: DateTimePickerComponent;

  public date: Date;
  public options: DateTimeOptions;

  constructor(public element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.readonly || changes.focus) && !this.readonly && this.focus) {
      setTimeout(() => {
        HtmlModifier.setCursorAtTextContentEnd(this.dateTimeInput.nativeElement);
        this.dateTimeInput.nativeElement.focus();
        this.dateTimePicker && this.dateTimePicker.open();
      });
    }
    if (changes.focus && !this.focus) {
      if (this.dateTimePicker) {
        this.dateTimePicker.close();
      }
    }
    if (changes.value && this.value) {
      this.date = this.value.toDate();
      this.options = createDateTimeOptions(this.value.config && this.value.config.format);
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.dateTimeInput) {
          const dataValue = this.value.parseInput(this.dateTimeInput.nativeElement.value);
          // needs to be executed after parent event handlers
          setTimeout(() => this.save.emit(dataValue));
        }
        return;
      case KeyCode.Escape:
        this.dateTimeInput && (this.dateTimeInput.nativeElement.value = this.value.format(false));
        this.cancel.emit();
        return;
    }
  }

  public onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const dataValue = this.value.parseInput(element.value);
    this.valueChange.emit(dataValue);
  }

  public onSave(date: Date) {
    if (date && !isDateValid(date)) {
      this.cancel.emit();
      return;
    }

    const dataValue = this.value.copy(date);

    if (dataValue.serialize() !== this.value.serialize() || this.value.inputType === DataValueInputType.Typed) {
      this.save.emit(dataValue);
    } else {
      this.cancel.emit();
    }
  }

  public onCancel() {
    this.dateTimeInput && (this.dateTimeInput.nativeElement.value = this.value.format());
    this.cancel.emit();
  }

  public ngAfterViewInit(): void {
    document.body.style.setProperty('--first-day-of-week', environment.locale === 'cs' ? '8' : '2');
  }

  public onValueChange(date: Date) {
    const dataValue = this.value.copy(date);
    this.dateTimeInput.nativeElement.value = dataValue.format();
    this.valueChange.emit(dataValue);
  }
}
