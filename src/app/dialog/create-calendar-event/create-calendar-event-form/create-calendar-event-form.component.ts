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

import {Component, ChangeDetectionStrategy, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {I18n} from '@ngx-translate/i18n-polyfill';
import * as moment from 'moment';
import {Collection} from '../../../core/store/collections/collection';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarCollectionConfig,
  CalendarConfig,
} from '../../../core/store/calendars/calendar.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject} from 'rxjs';
import {isDateValid} from '../../../shared/utils/common.utils';

const DEFAULT_EVENT_DURATION = 60;

@Component({
  selector: 'create-calendar-event-form',
  templateUrl: './create-calendar-event-form.component.html',
  styleUrls: ['./create-calendar-event-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCalendarEventFormComponent implements OnInit {
  @Input()
  public collections: Collection[];

  @Input()
  public initialTime: number;

  @Input()
  public config: CalendarConfig;

  @Output()
  public createEvent = new EventEmitter<DocumentModel>();

  public form: FormGroup;

  public currentStart$: BehaviorSubject<Date>;
  public currentEnd$: BehaviorSubject<Date>;

  public constructor(private fb: FormBuilder, private i18n: I18n) {}

  public ngOnInit() {
    this.createForm();
  }

  private createForm() {
    const currentStart = this.createEventStart();
    const currentEnd = this.createEventEnd();

    this.form = this.fb.group({
      collectionId: [this.getDefaultCollectionId(), Validators.required],
      allDay: false,
      title: [this.defaultTitleName(), Validators.required],
      eventStart: [currentStart, Validators.required],
      eventEnd: [currentEnd, Validators.required],
    });

    this.currentStart$ = new BehaviorSubject<Date>(currentStart);
    this.currentEnd$ = new BehaviorSubject<Date>(currentEnd);
  }

  private getDefaultCollectionId(): string {
    return this.collections && this.collections[0] && this.collections[0].id;
  }

  private createEventStart(): Date {
    return new Date(this.initialTime);
  }

  private createEventEnd(): Date {
    const eventStart = moment(this.createEventStart());
    return eventStart.add(DEFAULT_EVENT_DURATION, 'minutes').toDate();
  }

  private defaultTitleName(): string {
    return this.i18n({id: 'dialog.create.calendar.event.default.title', value: 'New event'});
  }

  public onStartChange(date: Date) {
    if (!isDateValid(date)) {
      this.refreshEventStart();
      return;
    }

    const newStart = this.checkDateChangeByTimes(this.currentStart$.getValue(), date);
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

  public onEndChange(date: Date) {
    if (!isDateValid(date)) {
      this.refreshEventEnd();
      return;
    }

    const newEnd = this.checkDateChangeByTimes(this.currentEnd$.getValue(), date);
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

  public onCollectionSelect(id: string) {
    this.form.controls.collectionId.setValue(id);
  }

  public onSubmit() {
    this.createEvent.emit(this.createEventDocument());
  }

  private createEventDocument(): DocumentModel {
    const {collectionId, title, allDay, eventStart, eventEnd} = this.form.value;
    const collectionConfig: CalendarCollectionConfig = (this.config && this.config.collections[collectionId]) || {};
    if (!collectionConfig.barsProperties) {
      return;
    }

    const titleProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.NAME];
    const startProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.START_DATE];
    const endProperty = collectionConfig.barsProperties[CalendarBarPropertyOptional.END_DATE];

    const data = {};
    if (titleProperty) {
      data[titleProperty.attributeId] = title;
    }

    if (startProperty) {
      data[startProperty.attributeId] = this.cleanDateWhenAllDay(eventStart, allDay);
    }

    if (endProperty) {
      data[endProperty.attributeId] = this.cleanDateWhenAllDay(eventEnd, allDay);
    }

    return {collectionId, data};
  }

  private cleanDateWhenAllDay(date: Date, allDay: boolean): Date {
    if (allDay) {
      return moment(date)
        .hours(0)
        .minutes(0)
        .seconds(0)
        .milliseconds(0)
        .toDate();
    }
    return moment(date)
      .seconds(0)
      .milliseconds(0)
      .toDate();
  }
}
