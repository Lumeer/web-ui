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
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import * as moment from 'moment';
import {BsDatepickerInlineConfig} from 'ngx-bootstrap/datepicker';
import {Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {DropdownPosition} from '../../dropdown/dropdown-position';
import {DropdownComponent} from '../../dropdown/dropdown.component';
import {KeyCode} from '../../key-code';
import {DateTimeOptions, detectDatePickerViewMode} from '../date-time-options';

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

  public readonly dropdownPositions = [
    DropdownPosition.BottomStart,
    DropdownPosition.TopStart,
    DropdownPosition.BottomEnd,
    DropdownPosition.TopEnd,
    DropdownPosition.Right,
    DropdownPosition.Left,
  ];

  public form = new FormGroup({
    date: new FormControl(),
  });

  public datePickerConfig: Partial<BsDatepickerInlineConfig>;
  public timeZone;

  private subscriptions = new Subscription();

  private selectedValue: Date;

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.value || changes.asUtc) && this.value) {
      this.dateControl.setValue(offsetTime(this.value, false, this.asUtc));
    }
    if ((changes.options || changes.asUtc) && this.options) {
      this.datePickerConfig = {
        containerClass: 'box-shadow-none theme-default',
        customTodayClass: 'date-time-today',
        minMode: detectDatePickerViewMode(this.options),
      };
    }
    if (changes.asUtc) {
      this.timeZone = this.asUtc
        ? 'UTC'
        : `UTC${moment().format('Z')}, ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    }
  }

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToDateChange());
  }

  private subscribeToDateChange(): Subscription {
    return this.dateControl.valueChanges
      .pipe(
        map(time => offsetTime(time, true, this.asUtc)),
        filter(value => value !== this.value)
      )
      .subscribe(value => {
        this.selectedValue = value;
        this.valueChange.emit(value);
      });
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
      ([
        KeyCode.Tab,
        KeyCode.Backspace,
        KeyCode.Delete,
        KeyCode.ArrowDown,
        KeyCode.ArrowLeft,
        KeyCode.ArrowRight,
        KeyCode.ArrowUp,
      ] as string[]).includes(event.code)
    ) {
      event.stopPropagation();
    }
  }

  public onDateChange(date: Date) {
    const parsedDate = date;
    if (!this.dateControl.value && date) {
      parsedDate.setHours(0, 0, 0, 0);
    }
    this.dateControl.setValue(parsedDate);
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
    this.save.emit(offsetTime(this.dateControl.value, true, this.asUtc));
  }

  public get dateControl(): AbstractControl {
    return this.form.get('date');
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape) {
      this.onCancel();
    }
  }

  public onCloseByClickOutside() {
    this.saveOnClose.emit(this.selectedValue);
    this.selectedValue = null;
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
