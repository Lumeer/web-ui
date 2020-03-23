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
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import {Constraint} from '../../../../core/model/constraint';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CalendarBarPropertyRequired, CalendarConfig, CalendarMode} from '../../../../core/store/calendars/calendar';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {checkOrTransformCalendarConfig, createCalendarEvents} from '../util/calendar-util';
import {Query} from '../../../../core/store/navigation/query/query';
import * as moment from 'moment';
import {deepObjectsEquals, isDateValid} from '../../../../shared/utils/common.utils';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {CalendarEventDetailModalComponent} from '../../../../shared/modal/calendar-event-detail/calendar-event-detail-modal.component';
import {ModalService} from '../../../../shared/modal/modal.service';
import {CalendarEvent, CalendarMetaData} from '../util/calendar-event';

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

  public events$: Observable<CalendarEvent[]>;
  public dataSubject = new BehaviorSubject<Data>(null);

  constructor(
    @Inject(LOCALE_ID) public locale: string,
    private renderer: Renderer2,
    private modalService: ModalService
  ) {}

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
  }

  public onRangeChanged(data: {newMode: CalendarMode; newDate: Date}) {
    if (this.canManageConfig) {
      const config = {...this.config, mode: data.newMode, date: data.newDate};
      this.configChange.next(config);
    }
  }

  public onDocumentRangeChanged(data: {metadata: CalendarMetaData; start: Date; end?: Date}) {
    const {metadata, start, end} = data;
    const changedDocument = this.documents.find(document => document.id === metadata.documentId);
    if (!changedDocument) {
      return;
    }
    const collection = (this.collections || []).find(c => c.id === changedDocument.collectionId);

    const patchDocument = {...changedDocument, data: {}};

    const attributes = collection?.attributes || [];
    if (start) {
      const attribute = attributes.find(a => a.id === metadata.startAttributeId);
      patchDocument.data[attribute.id] = this.getSaveValue(start, attribute?.constraint);
    }

    if (end && metadata.endAttributeId) {
      const attribute = attributes.find(a => a.id === metadata.endAttributeId);
      patchDocument.data[attribute.id] = this.getSaveValue(end, attribute?.constraint);
    }

    this.patchData.emit(patchDocument);
  }

  private getSaveValue(value: Date, constraint: Constraint): any {
    if (constraint) {
      return constraint.createDataValue(value, this.constraintData).serialize();
    } else if (isDateValid(value)) {
      return moment(value).toISOString();
    } else {
      return value;
    }
  }

  public onNewEvent(data: {start: Date; end: Date}) {
    if (this.isAtLeastOneCollectionWritable()) {
      const config = {
        initialState: {...data, config: this.config, permissions: this.permissions},
        class: 'modal-lg',
      };
      config['backdrop'] = 'static';
      this.modalService.show(CalendarEventDetailModalComponent, config);
    }
  }

  private isAtLeastOneCollectionWritable(): boolean {
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

  public onEventClicked(event: CalendarEvent) {
    const collection = (this.collections || []).find(coll => coll.id === event.extendedProps.collectionId);
    const document = (this.documents || []).find(doc => doc.id === event.extendedProps.documentId);
    const stemIndex = event.extendedProps.stemIndex;
    if (collection && document) {
      const config = {
        initialState: {document, collection, stemIndex, config: this.config, permissions: this.permissions},
        class: 'modal-lg',
      };
      this.modalService.show(CalendarEventDetailModalComponent, config);
    }
  }
}
