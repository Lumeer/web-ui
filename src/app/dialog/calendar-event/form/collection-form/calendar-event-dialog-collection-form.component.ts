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

import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarCollectionConfig,
} from '../../../../core/store/calendars/calendar.model';
import {isDateValid} from '../../../../shared/utils/common.utils';
import * as moment from 'moment';
import {BehaviorSubject} from 'rxjs';
import {DEFAULT_EVENT_DURATION} from '../calendar-event-dialog-form.component';
import {Collection} from '../../../../core/store/collections/collection';
import {isAttributeEditable} from '../../../../core/store/collections/collection.util';

@Component({
  selector: 'calendar-event-dialog-collection-form',
  templateUrl: './calendar-event-dialog-collection-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDialogCollectionFormComponent implements OnInit {
  @Input()
  public form: FormGroup;

  @Input()
  public collectionConfig: CalendarCollectionConfig;

  @Input()
  public collection: Collection;

  public readonly requiredProperty = CalendarBarPropertyRequired;
  public readonly optionalProperty = CalendarBarPropertyOptional;

  public currentStart$: BehaviorSubject<Date>;
  public currentEnd$: BehaviorSubject<Date>;

  public ngOnInit() {
    this.currentStart$ = new BehaviorSubject<Date>(this.form.controls.eventStart.value);
    this.currentEnd$ = new BehaviorSubject<Date>(this.form.controls.eventEnd.value);
  }

  public onStartChange(date: Date) {
    if (!isDateValid(date)) {
      this.refreshEventStart();
      return;
    }

    const newStart = this.checkDateChangeByTimes(this.currentStart$.getValue(), date);
    if (this.eventStartIsNotCorrect(newStart)) {
      this.refreshEventStart();
      return;
    }

    if (this.datesChanged(newStart, date)) {
      this.form.controls.eventStart.setValue(newStart);
    }
    const newEnd = this.checkDateEndBeforeStart(newStart);
    if (this.datesChanged(newEnd, this.currentEnd$.getValue())) {
      this.form.controls.eventEnd.setValue(newEnd);
    }

    this.currentStart$.next(newStart);
  }

  private refreshEventStart() {
    const currentStart = this.currentStart$.getValue();
    this.form.controls.eventStart.setValue(currentStart);
    this.currentStart$.next(new Date(currentStart.getTime()));
  }

  // happens when end attribute is not editable and start is after end
  private eventStartIsNotCorrect(date: Date): boolean {
    const endProperty = this.collectionConfig && this.collectionConfig.barsProperties[this.optionalProperty.EndDate];
    const isEndEditable = !endProperty || isAttributeEditable(endProperty.attributeId, this.collection);
    const currentEnd = this.currentEnd$.getValue();

    return !isEndEditable && date.getTime() >= currentEnd.getTime();
  }

  public onEndChange(date: Date) {
    if (!isDateValid(date)) {
      this.refreshEventEnd();
      return;
    }

    const newEnd = this.checkDateChangeByTimes(this.currentEnd$.getValue(), date);
    if (this.eventEndIsNotCorrect(newEnd)) {
      this.refreshEventEnd();
      return;
    }

    if (this.datesChanged(newEnd, date)) {
      this.form.controls.eventEnd.setValue(newEnd);
    }
    const newStart = this.checkDateStartAfterEnd(newEnd);
    if (this.datesChanged(newStart, this.currentStart$.getValue())) {
      this.form.controls.eventStart.setValue(newStart);
    }

    this.currentEnd$.next(newEnd);
  }

  private refreshEventEnd() {
    const currentEnd = this.currentEnd$.getValue();
    this.form.controls.eventEnd.setValue(currentEnd);
    this.currentEnd$.next(new Date(currentEnd.getTime()));
  }

  // happens when start attribute is not editable and end is before start
  private eventEndIsNotCorrect(date: Date): boolean {
    const startProperty =
      this.collectionConfig && this.collectionConfig.barsProperties[this.requiredProperty.StartDate];
    const isStartEditable = !startProperty || isAttributeEditable(startProperty.attributeId, this.collection);
    const currentStart = this.currentStart$.getValue();

    return !isStartEditable && date.getTime() <= currentStart.getTime();
  }

  private checkDateChangeByTimes(dateBefore: Date, dateAfter: Date): Date {
    if (dateBefore.getDate() !== dateAfter.getDate()) {
      return dateAfter;
    }

    const hourBefore = dateBefore.getHours();
    const hourAfter = dateAfter.getHours();

    if (hourBefore === 23 && hourAfter === 0) {
      return moment(dateAfter)
        .add(1, 'days')
        .toDate();
    }
    if (hourBefore === 0 && hourAfter === 23) {
      return moment(dateAfter)
        .subtract(1, 'days')
        .toDate();
    }

    return dateAfter;
  }

  private checkDateEndBeforeStart(start: Date): Date {
    if (moment(this.currentEnd$.getValue()).isSameOrBefore(start)) {
      return moment(start)
        .add(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
    }
    return this.currentEnd$.getValue();
  }

  private checkDateStartAfterEnd(end: Date): Date {
    if (moment(this.currentStart$.getValue()).isSameOrAfter(end)) {
      return moment(end)
        .subtract(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
    }
    return this.currentStart$.getValue();
  }

  private datesChanged(date1: Date, date2: Date): boolean {
    return date1.getTime() !== date2.getTime();
  }
}
