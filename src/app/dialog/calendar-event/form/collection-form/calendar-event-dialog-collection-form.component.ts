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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {DateTimeConstraintConfig} from '../../../../core/model/data/constraint-config';
import {
  CalendarBar,
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarStemConfig,
} from '../../../../core/store/calendars/calendar';
import {Collection} from '../../../../core/store/collections/collection';
import {Query} from '../../../../core/store/navigation/query/query';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DEFAULT_EVENT_DURATION} from '../calendar-event-dialog-form.component';
import * as moment from 'moment';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {ConstraintType} from '../../../../core/model/data/constraint';
import {Subscription} from 'rxjs';

@Component({
  selector: 'calendar-event-dialog-collection-form',
  templateUrl: './calendar-event-dialog-collection-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDialogCollectionFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public form: FormGroup;

  @Input()
  public collectionConfig: CalendarStemConfig;

  @Input()
  public collection: Collection;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  private subscriptions = new Subscription();

  public readonly requiredProperty = CalendarBarPropertyRequired;
  public readonly optionalProperty = CalendarBarPropertyOptional;

  public eventStartFormat: string;
  public eventEndFormat: string;

  public get allDayControl(): AbstractControl {
    return this.form.get('allDay');
  }

  public get eventStartControl(): AbstractControl {
    return this.form.get('eventStart');
  }

  public get eventEndControl(): AbstractControl {
    return this.form.get('eventEnd');
  }

  public ngOnInit() {
    if (this.allDayControl) {
      this.subscriptions.add(this.allDayControl.valueChanges.subscribe(() => this.initFormats()));
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collectionConfig && this.collectionConfig) {
      this.initFormats();
    }
  }

  private initFormats() {
    const startProperty = this.collectionConfig.barsProperties[CalendarBarPropertyRequired.StartDate];
    const endProperty = this.collectionConfig.barsProperties[CalendarBarPropertyOptional.EndDate];
    const isAllDay = this.allDayControl.value;

    this.eventStartFormat = this.createPropertyFormat(startProperty, isAllDay);
    this.eventEndFormat = this.createPropertyFormat(endProperty, isAllDay);
  }

  private createPropertyFormat(property: CalendarBar, allDay: boolean): string {
    if (property) {
      const constraint = findAttributeConstraint(this.collection.attributes, property.attributeId);
      if (constraint && constraint.type === ConstraintType.DateTime && constraint.config) {
        return (constraint.config as DateTimeConstraintConfig).format;
      }
    }

    return this.createDefaultFormat(allDay);
  }

  private createDefaultFormat(allDay: boolean): string {
    return allDay ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm';
  }

  public eventStartValueChange(date: Date) {
    this.eventStartControl.setValue(date);

    if (this.eventEndControl) {
      const newEnd = this.checkDateEndBeforeStart(date);
      if (this.datesChanged(newEnd, this.eventEndControl.value)) {
        this.eventEndControl.setValue(newEnd);
      }
    }
  }

  public eventEndValueChange(date: Date) {
    this.eventEndControl.setValue(date);

    if (this.eventStartControl) {
      const newStart = this.checkDateStartAfterEnd(date);
      if (this.datesChanged(newStart, this.eventStartControl.value)) {
        this.form.controls.eventStart.setValue(newStart);
      }
    }
  }

  private checkDateEndBeforeStart(start: Date): Date {
    if (moment(this.eventEndControl.value).isSameOrBefore(start)) {
      return moment(start)
        .add(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
    }
    return this.eventEndControl.value;
  }

  private checkDateStartAfterEnd(end: Date): Date {
    if (moment(this.eventStartControl.value).isSameOrAfter(end)) {
      return moment(end)
        .subtract(DEFAULT_EVENT_DURATION, 'minutes')
        .toDate();
    }
    return this.eventStartControl.value;
  }

  private datesChanged(date1: Date, date2: Date): boolean {
    return date1.getTime() !== date2.getTime();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
