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
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import * as moment from 'moment';
import {BsDatepickerInlineConfig, BsDatepickerInlineDirective} from 'ngx-bootstrap/datepicker';
import {Subscription} from 'rxjs';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {keyboardEventCode, KeyCode} from '../../key-code';
import {DateTimeOptions, detectDatePickerViewMode, hasTimeOption} from '../date-time-options';
import {isDateValid} from '../../utils/common.utils';

@Component({
  selector: 'date-time-picker',
  templateUrl: './date-time-picker.component.html',
  styleUrls: ['./date-time-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimePickerComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public min: Date;

  @Input()
  public max: Date;

  @Input()
  public options: DateTimeOptions;

  @Input()
  public value: Date;

  @Input()
  public asUtc: boolean;

  @Output()
  public valueChange = new EventEmitter<Date>();

  @Output()
  public saveOnClose = new EventEmitter<Date>();

  @Output()
  public save = new EventEmitter<Date>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  @ViewChild(BsDatepickerInlineDirective)
  public datePicker: BsDatepickerInlineDirective;

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
    DropdownPosition.Right,
    DropdownPosition.Left,
  ];

  public form = new UntypedFormGroup({
    date: new UntypedFormControl(),
    time: new UntypedFormControl(),
  });

  public datePickerConfig: Partial<BsDatepickerInlineConfig>;
  public timeZone;

  private subscriptions = new Subscription();
  private hasTimeOptions: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.options || changes.asUtc) && this.options) {
      this.datePickerConfig = {
        containerClass: 'box-shadow-none theme-default',
        customTodayClass: 'date-time-today',
        minMode: detectDatePickerViewMode(this.options),
        useUtc: this.asUtc,
      };
      this.hasTimeOptions = hasTimeOption(this.options);
    }
    if ((changes.value || changes.asUtc || changes.options) && this.value) {
      this.setCurrentDateAndTime(this.setupDate());
    }
    if (changes.asUtc) {
      this.timeZone = this.asUtc
        ? 'UTC'
        : `UTC${moment().format('Z')}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    }
  }

  private setupDate(): Date {
    const date = offsetTime(this.value, false, this.asUtc);
    if (!this.hasTimeOptions) {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToTimeChange());
  }

  private subscribeToTimeChange(): Subscription {
    return this.timeControl.valueChanges.subscribe(() => this.emitDateChange());
  }

  public onDateChange(date: Date) {
    this.dateControl.setValue(date);
    this.timeControl.setValue(this.getCurrentDate(), {emitEvent: false});

    this.emitDateChange();
  }

  private emitDateChange() {
    const saveDate = this.getSaveDate();
    if (saveDate && (!this.value || this.value.getTime() !== saveDate.getTime())) {
      this.valueChange.emit(this.getSaveDate());
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.close();
  }

  public onClick(event: MouseEvent) {
    // otherwise it is immediately closed in table
    event.stopPropagation();
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onTimePickerKeyDown(event: KeyboardEvent) {
    if (
      (
        [
          KeyCode.Tab,
          KeyCode.Backspace,
          KeyCode.Delete,
          KeyCode.ArrowDown,
          KeyCode.ArrowLeft,
          KeyCode.ArrowRight,
          KeyCode.ArrowUp,
        ] as string[]
      ).includes(keyboardEventCode(event))
    ) {
      event.stopPropagation();
    }
  }

  private setCurrentDateAndTime(date: Date) {
    this.dateControl.setValue(new Date(date));
    this.timeControl.setValue(new Date(date));
  }

  private getCurrentDate(): Date {
    const currentDate = <Date>this.dateControl.value;
    const currentTime = <Date>this.timeControl.value;

    if (isDateValid(currentDate) || isDateValid(currentTime)) {
      const date = isDateValid(currentDate) ? new Date(currentDate) : new Date();
      if (isDateValid(currentTime)) {
        date.setHours(
          currentTime.getHours(),
          currentTime.getMinutes(),
          currentTime.getSeconds(),
          currentTime.getMilliseconds()
        );
      }
      return date;
    }
    return currentDate;
  }

  private getSaveDate(): Date {
    return this.getCurrentDate();
  }

  public onCancel(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.close();
    this.cancel.emit();
  }

  public onSave(event: MouseEvent) {
    event.stopPropagation();
    this.close();
    this.save.emit(this.getSaveDate());
  }

  public get dateControl(): AbstractControl {
    return this.form.get('date');
  }

  public get timeControl(): AbstractControl {
    return this.form.get('time');
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape) {
      this.onCancel();
    }
  }

  public onCloseByClickOutside() {
    this.saveOnClose.emit(this.getSaveDate());
  }

  public clickedInside(event: MouseEvent): boolean {
    return this.dropdown && !this.dropdown.clickedOutside(event);
  }
}

function offsetTime(date: Date, backwards?: boolean, utc?: boolean): Date {
  if (utc && date) {
    const parsedDate = new Date(date);
    parsedDate.setHours(parsedDate.getHours() + (parsedDate.getTimezoneOffset() / 60) * (backwards ? -1 : 1));
    return parsedDate;
  } else {
    return date;
  }
}
