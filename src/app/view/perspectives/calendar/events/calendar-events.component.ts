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
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CalendarBarPropertyRequired, CalendarConfig, CalendarMode} from '../../../../core/store/calendars/calendar';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {BehaviorSubject, Observable} from 'rxjs';
import {CalendarEvent} from 'angular-calendar';
import {debounceTime, filter, map} from 'rxjs/operators';
import {CalendarMetaData, checkOrTransformCalendarConfig, createCalendarEvents} from '../util/calendar-util';
import {getSaveValue} from '../../../../shared/utils/data.utils';
import {Query} from '../../../../core/store/navigation/query';
import * as moment from 'moment';
import {deepObjectsEquals, isDateValid} from '../../../../shared/utils/common.utils';
import {Constraint, ConstraintData} from '../../../../core/model/data/constraint';
import {CalendarHeaderComponent} from './header/calendar-header.component';
import {CalendarVisualizationComponent} from './visualization/calendar-visualization.component';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  config: CalendarConfig;
  permissions: Record<string, AllowedPermissions>;
  query: Query;
  constraintData: ConstraintData;
}

@Component({
  selector: 'calendar-events',
  templateUrl: './calendar-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventsComponent implements OnInit, OnChanges {
  @ViewChild(CalendarHeaderComponent, {read: ElementRef, static: false})
  public calendarHeaderElement: ElementRef;

  @ViewChild(CalendarVisualizationComponent, {read: ElementRef, static: false})
  set content(content: ElementRef) {
    this.calendarVisualizationElement = content;
    this.computeMaxVisualizationHeight();
  }

  private calendarVisualizationElement: ElementRef;

  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: CalendarConfig;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public query: Query;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @Output()
  public configChange = new EventEmitter<CalendarConfig>();

  @Output()
  public newEvent = new EventEmitter<number>();

  @Output()
  public updateEvent = new EventEmitter<{documentId: string; stemIndex: number}>();

  public currentMode$ = new BehaviorSubject<CalendarMode>(CalendarMode.Month);
  public currentDate$ = new BehaviorSubject<Date>(new Date());

  public events$: Observable<CalendarEvent<CalendarMetaData>[]>;
  public dataSubject = new BehaviorSubject<Data>(null);

  constructor(@Inject(LOCALE_ID) public locale: string, private renderer: Renderer2) {}

  public ngOnInit() {
    this.events$ = this.subscribeToEvents();
  }

  private subscribeToEvents(): Observable<CalendarEvent[]> {
    return this.dataSubject.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => this.handleData(data))
    );
  }

  private handleData(data: Data): CalendarEvent[] {
    const config = checkOrTransformCalendarConfig(data.config, data.query, data.collections);
    if (!deepObjectsEquals(config, data.config)) {
      this.configChange.emit(config);
    }

    return createCalendarEvents(
      config,
      data.collections,
      data.documents,
      data.permissions || {},
      this.constraintData,
      data.query
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.documents ||
        changes.config ||
        changes.collections ||
        changes.permissions ||
        changes.query ||
        changes.constraintData) &&
      this.config
    ) {
      this.dataSubject.next({
        documents: this.documents,
        collections: this.collections,
        permissions: this.permissions,
        config: this.config,
        query: this.query,
        constraintData: this.constraintData,
      });
    }
    if (changes.config && this.config) {
      this.currentMode$.next(this.config.mode);
      this.currentDate$.next(this.config.date);
    }
  }

  public onModeChange(mode: CalendarMode) {
    if (this.canManageConfig) {
      const config = {...this.config, mode};
      this.configChange.next(config);
    } else {
      this.currentMode$.next(mode);
    }
  }

  public onViewDateChange(date: Date) {
    if (this.canManageConfig) {
      const config = {...this.config, date};
      this.configChange.next(config);
    } else {
      this.currentDate$.next(date);
    }
  }

  public onValueChanged(data: {documentId: string; changes: {attributeId: string; value: any}[]}) {
    const {documentId, changes} = data;
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }
    const collection = (this.collections || []).find(c => c.id === changedDocument.collectionId);

    const patchDocument = {...changedDocument, data: {}};
    changes.forEach(change => {
      const attribute = ((collection && collection.attributes) || []).find(a => a.id === change.attributeId);
      patchDocument.data[change.attributeId] = this.getSaveValue(change.value, attribute && attribute.constraint);
    });
    this.patchData.emit(patchDocument);
  }

  private getSaveValue(value: any, constraint: Constraint): any {
    if (constraint) {
      return getSaveValue(value, constraint, this.constraintData);
    } else if (isDateValid(value)) {
      return moment(value).toISOString();
    } else {
      return value;
    }
  }

  public onNewEvent(time: number) {
    if (this.isAtLeastOneWritable()) {
      this.newEvent.emit(time);
    }
  }

  private isAtLeastOneWritable(): boolean {
    for (const [collectionId, permissions] of Object.entries(this.permissions)) {
      if (permissions.writeWithView && this.collectionHasConfig(collectionId)) {
        return true;
      }
    }
    return false;
  }

  private collectionHasConfig(collectionId: string): boolean {
    return (this.config.stemsConfigs || []).some(
      config =>
        config.stem &&
        config.stem.collectionId === collectionId &&
        config.barsProperties &&
        !!config.barsProperties[CalendarBarPropertyRequired.Name] &&
        !!config.barsProperties[CalendarBarPropertyRequired.StartDate]
    );
  }

  public onEventClicked(event: CalendarEvent<CalendarMetaData>) {
    this.updateEvent.emit({...event.meta});
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.computeMaxVisualizationHeight();
  }

  private computeMaxVisualizationHeight() {
    if (this.calendarVisualizationElement) {
      const calendarHeaderHeight =
        (this.calendarHeaderElement && this.calendarHeaderElement.nativeElement.offsetHeight) || 0;
      this.renderer.setStyle(
        this.calendarVisualizationElement.nativeElement,
        'max-height',
        `calc(100% - 1rem - ${calendarHeaderHeight}px)`
      );
    }
  }
}
