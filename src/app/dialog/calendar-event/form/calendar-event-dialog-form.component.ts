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
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarStemConfig,
  CalendarConfig,
} from '../../../core/store/calendars/calendar.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {isAllDayEvent, parseCalendarEventDate} from '../../../view/perspectives/calendar/util/calendar-util';
import {deepObjectsEquals, isDateValid, isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {findAttributeConstraint, isCollectionAttributeEditable} from '../../../core/store/collections/collection.util';
import {Query} from '../../../core/store/navigation/query';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {User} from '../../../core/store/users/user';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {getSaveValue} from '../../../shared/utils/data.utils';
import {Constraint, ConstraintData} from '../../../core/model/data/constraint';

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
  public stemIndex: number;

  @Input()
  public config: CalendarConfig;

  @Input()
  public document: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public currentUser: User;

  @Input()
  public allowedPermissions: Record<string, AllowedPermissions>;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public createEvent = new EventEmitter<DocumentModel>();

  @Output()
  public updateEvent = new EventEmitter<DocumentModel>();

  public readonly collectionPlaceholder: string;

  public form: FormGroup;

  public constructor(private fb: FormBuilder, private i18n: I18n) {
    this.collectionPlaceholder = i18n({id: 'dialog.calendar.event.collection', value: 'Table'});
  }

  public get stemIndexControl(): AbstractControl {
    return this.form.controls.stemIndex;
  }

  public ngOnInit() {
    this.createForm();
  }

  private createForm() {
    const {stemIndex, allDay, title, eventStart, eventEnd, startEditable, endEditable} = this.getInitialDocumentData();

    this.form = this.fb.group({
      stemIndex: [isNotNullOrUndefined(stemIndex) && stemIndex >= 0 ? stemIndex : 0, Validators.required],
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
    stemIndex?: number;
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

    const stemIndex = isNotNullOrUndefined(this.stemIndex)
      ? this.stemIndex
      : ((this.config && this.config.stemsConfigs) || []).findIndex(
          sc => sc.stem && sc.stem.collectionId === this.document.collectionId
        );
    const collectionConfig = stemIndex >= 0 ? this.config.stemsConfigs[stemIndex] : {};
    const collectionPermissions =
      (this.allowedPermissions && this.allowedPermissions[this.document.collectionId]) || {};
    const titleProperty =
      collectionConfig.barsProperties && collectionConfig.barsProperties[CalendarBarPropertyRequired.Name];
    const startProperty =
      collectionConfig.barsProperties && collectionConfig.barsProperties[CalendarBarPropertyRequired.StartDate];
    const endProperty =
      collectionConfig.barsProperties && collectionConfig.barsProperties[CalendarBarPropertyOptional.EndDate];

    const collectionId = this.document.collectionId;
    const collection = this.collections && this.collections.find(coll => coll.id === collectionId);
    const title = titleProperty && this.document.data[titleProperty.attributeId];
    const start = parseCalendarEventDate(startProperty && this.document.data[startProperty.attributeId]);
    const end = parseCalendarEventDate(endProperty && this.document.data[endProperty.attributeId]);

    const {eventStart, eventEnd} = this.createEventDatesFromDocument(start, end);

    const allDay = isAllDayEvent(eventStart, eventEnd);

    const startEditable = isCollectionAttributeEditable(
      startProperty && startProperty.attributeId,
      collection,
      collectionPermissions,
      this.query
    );
    const endEditable = isCollectionAttributeEditable(
      endProperty && endProperty.attributeId,
      collection,
      collectionPermissions,
      this.query
    );

    return {stemIndex, allDay, title, eventStart, eventEnd, startEditable, endEditable};
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

  public onStemIndexSelect(index: number) {
    this.stemIndexControl.setValue(index);
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
    const {stemIndex, title, allDay, eventStart, eventEnd} = this.form.value;
    const collectionConfig: CalendarStemConfig = (this.config && this.config.stemsConfigs[stemIndex]) || {};
    if (!collectionConfig.barsProperties) {
      return;
    }
    const collectionId = collectionConfig.stem.collectionId;
    const collectionPermissions = (this.allowedPermissions && this.allowedPermissions[collectionId]) || {};

    const titleProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.Name];
    const startProperty = collectionConfig.barsProperties[CalendarBarPropertyRequired.StartDate];
    const endProperty = collectionConfig.barsProperties[CalendarBarPropertyOptional.EndDate];
    const collection = this.collections && this.collections.find(coll => coll.id === collectionId);

    const data = this.document ? {...this.document.data} : this.generateDocumentData(collectionId);
    if (titleProperty) {
      data[titleProperty.attributeId] = title;
    }

    if (
      eventStart &&
      startProperty &&
      isCollectionAttributeEditable(
        startProperty && startProperty.attributeId,
        collection,
        collectionPermissions,
        this.query
      )
    ) {
      const cleanedEventStart = this.cleanDateWhenAllDay(eventStart, allDay);
      data[startProperty.attributeId] = this.getSaveValue(
        cleanedEventStart,
        findAttributeConstraint(collection.attributes, startProperty.attributeId)
      );
    }

    if (
      eventEnd &&
      endProperty &&
      isCollectionAttributeEditable(
        endProperty && endProperty.attributeId,
        collection,
        collectionPermissions,
        this.query
      )
    ) {
      const cleanedEventEnd = this.cleanDateWhenAllDay(eventEnd, allDay);
      data[endProperty.attributeId] = this.getSaveValue(
        cleanedEventEnd,
        findAttributeConstraint(collection.attributes, endProperty.attributeId)
      );
    }

    return {...this.document, collectionId, data};
  }

  private getSaveValue(value: Date, constraint: Constraint): string {
    if (constraint) {
      return getSaveValue(value, constraint, this.constraintData);
    } else {
      return moment(value).toISOString();
    }
  }

  private generateDocumentData(collectionId: string): {[attributeId: string]: any} {
    const collection = this.collections.find(coll => coll.id === collectionId);
    const stem = this.query && (this.query.stems || []).find(s => s.collectionId === collectionId);
    const filters = (stem && (stem.filters || []).filter(filter => filter.collectionId === collectionId)) || [];
    return generateDocumentData(collection, filters, this.currentUser);
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
