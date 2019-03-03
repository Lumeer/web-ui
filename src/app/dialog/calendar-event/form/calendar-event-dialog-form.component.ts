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
  Component,
  ChangeDetectionStrategy,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';

import {I18n} from '@ngx-translate/i18n-polyfill';
import * as moment from 'moment';
import {Collection} from '../../../core/store/collections/collection';
import {
  CALENDAR_DATE_FORMAT,
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarCollectionConfig,
  CalendarConfig,
} from '../../../core/store/calendars/calendar.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {isAllDayEvent, parseCalendarEventDate} from '../../../view/perspectives/calendar/util/calendar-util';
import {deepObjectsEquals, isDateValid} from '../../../shared/utils/common.utils';
import {isAttributeEditable} from '../../../core/store/collections/collection.util';

export const DEFAULT_EVENT_DURATION = 60;

@Component({
  selector: 'create-calendar-event-form',
  templateUrl: './calendar-event-dialog-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDialogFormComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public initialTime: number;

  @Input()
  public config: CalendarConfig;

  @Input()
  public document: DocumentModel;

  @Output()
  public createEvent = new EventEmitter<DocumentModel>();

  @Output()
  public updateEvent = new EventEmitter<DocumentModel>();

  public readonly collectionPlaceholder: string;

  public form: FormGroup;

  public constructor(private fb: FormBuilder, private i18n: I18n) {
    this.collectionPlaceholder = i18n({id: 'dialog.calendar.event.collection', value: 'Collection'});
  }

  public get collectionIdControl(): AbstractControl {
    return this.form.controls.collectionId;
  }

  public ngOnInit() {
    this.createForm();
  }

  private createForm() {
    const {
      collectionId,
      allDay,
      title,
      eventStart,
      eventEnd,
      startEditable,
      endEditable,
    } = this.getInitialDocumentData();

    this.form = this.fb.group({
      collectionId: [collectionId || this.getInitialCollection(), Validators.required],
      allDay: allDay || this.getInitialAllDay(),
      title: [title || this.getInitialTitleName(), Validators.required],
      eventStart: [eventStart || this.getInitialEventStart(), Validators.required],
      eventEnd: [eventEnd || this.getInitialEventEnd(), Validators.required],
    });

    if (!startEditable) {
      this.form.controls.allDay.disable();
      this.form.controls.eventStart.disable();
    }

    if (!endEditable) {
      this.form.controls.eventEnd.disable();
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collections && this.form) {
      this.disableOrEnableControls();
    }
  }

  private disableOrEnableControls() {
    const {startEditable, endEditable} = this.getInitialDocumentData();
    if (startEditable) {
      this.form.controls.allDay.enable();
      this.form.controls.eventStart.enable();
    } else {
      this.form.controls.allDay.disable();
      this.form.controls.eventStart.disable();
    }

    if (endEditable) {
      this.form.controls.eventEnd.enable();
    } else {
      this.form.controls.eventEnd.disable();
    }
  }

  private getInitialDocumentData(): {
    collectionId?: string;
    allDay?: boolean;
    title?: string;
    eventStart?: Date;
    eventEnd?: Date;
    startEditable?: boolean;
    endEditable?: boolean;
  } {
    if (!this.document) {
      return {startEditable: true, endEditable: true};
    }

    const collectionConfig = (this.config && this.config.collections[this.document.collectionId]) || {};
    const titleProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.Name];
    const startProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.StartDate];
    const endProperty = collectionConfig.barsProperties[CalendarBarPropertyOptional.EndDate];

    const collectionId = this.document.collectionId;
    const collection = this.collections && this.collections.find(coll => coll.id === collectionId);
    const title = titleProperty && this.document.data[titleProperty.attributeId];
    const start = parseCalendarEventDate(startProperty && this.document.data[startProperty.attributeId]);
    const end = parseCalendarEventDate(endProperty && this.document.data[endProperty.attributeId]);

    const {eventStart, eventEnd} = this.createEventDatesFromDocument(start, end);

    const allDay = isAllDayEvent(eventStart, eventEnd);

    const startEditable = isAttributeEditable(startProperty && startProperty.attributeId, collection);
    const endEditable = isAttributeEditable(endProperty && endProperty.attributeId, collection);

    return {collectionId, allDay, title, eventStart, eventEnd, startEditable, endEditable};
  }

  private createEventDatesFromDocument(start: Date, end: Date): {eventStart: Date; eventEnd: Date} {
    if (isDateValid(start) && isDateValid(end)) {
      return {eventStart: start, eventEnd: end};
    } else if (isDateValid(start)) {
      const eventEnd = moment(start)
        .add(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
      return {eventStart: start, eventEnd};
    } else if (isDateValid(end)) {
      const eventStart = moment(start)
        .subtract(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
      return {eventStart, eventEnd: end};
    }

    return {
      eventStart: new Date(),
      eventEnd: moment()
        .add(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate(),
    };
  }

  private getInitialCollection(): string {
    return this.collections && this.collections[0] && this.collections[0].id;
  }

  private getInitialAllDay(): boolean {
    return false;
  }

  private getInitialEventStart(): Date {
    return new Date(this.initialTime);
  }

  private getInitialEventEnd(): Date {
    const eventStart = moment(this.getInitialEventStart());
    return eventStart.add(DEFAULT_EVENT_DURATION, 'minutes').toDate();
  }

  private getInitialTitleName(): string {
    return this.i18n({id: 'dialog.create.calendar.event.default.title', value: 'New event'});
  }

  public onCollectionSelect(id: string) {
    this.form.controls.collectionId.setValue(id);
  }

  public onSubmit() {
    if (this.document) {
      const updateDocument = this.createEventDocument();
      if (!deepObjectsEquals(this.document.data, updateDocument.data)) {
        this.updateEvent.emit(updateDocument);
      }
    } else {
      this.createEvent.emit(this.createEventDocument());
    }
  }

  private createEventDocument(): DocumentModel {
    const {collectionId, title, allDay, eventStart, eventEnd} = this.form.value;
    const collectionConfig: CalendarCollectionConfig = (this.config && this.config.collections[collectionId]) || {};
    if (!collectionConfig.barsProperties) {
      return;
    }

    const titleProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.Name];
    const startProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.StartDate];
    const endProperty = collectionConfig.barsProperties[CalendarBarPropertyOptional.EndDate];
    const collection = this.collections && this.collections.find(coll => coll.id === collectionId);

    const data = (this.document && {...this.document.data}) || {};
    if (titleProperty) {
      data[titleProperty.attributeId] = title;
    }

    if (eventStart && startProperty && isAttributeEditable(startProperty && startProperty.attributeId, collection)) {
      data[startProperty.attributeId] = this.cleanDateWhenAllDay(eventStart, allDay);
    }

    if (eventEnd && endProperty && isAttributeEditable(endProperty && endProperty.attributeId, collection)) {
      data[endProperty.attributeId] = this.cleanDateWhenAllDay(eventEnd, allDay);
    }

    return {...this.document, collectionId, data};
  }

  private cleanDateWhenAllDay(date: Date, allDay: boolean): string {
    if (allDay) {
      return moment(date)
        .hours(0)
        .minutes(0)
        .seconds(0)
        .milliseconds(0)
        .format(CALENDAR_DATE_FORMAT);
    }
    return moment(date)
      .seconds(0)
      .milliseconds(0)
      .format(CALENDAR_DATE_FORMAT);
  }
}
