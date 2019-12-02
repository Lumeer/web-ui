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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentData, DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {selectAllCollections, selectCollectionById} from '../../../core/store/collections/collections.state';
import {map, mergeMap, take, tap} from 'rxjs/operators';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
  CalendarStemConfig,
} from '../../../core/store/calendars/calendar';
import {
  DEFAULT_EVENT_DURATION,
  isAllDayEvent,
  parseCalendarEventDate,
} from '../../../view/perspectives/calendar/util/calendar-util';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import * as moment from 'moment';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DocumentsAction} from '../../../core/store/documents/documents.action';

@Component({
  templateUrl: './calendar-event-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDetailModalComponent implements OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public stemIndex: number = 0;

  @Input()
  public initialTime: number;

  @Input()
  public config: CalendarConfig;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  public collection$: Observable<Collection>;
  public document$: Observable<DocumentModel>;
  public query$: Observable<Query>;
  public collections$: Observable<Collection[]>;

  public allDay$ = new BehaviorSubject(false);
  public stemIndex$ = new BehaviorSubject(0);

  private currentDocument: DocumentModel;

  constructor(private store$: Store<AppState>, private i18n: I18n) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
    this.collections$ = this.store$.pipe(select(selectAllCollections));
    if (this.document && this.collection) {
      this.document$ = of(this.document);
      this.collection$ = of(this.collection);
      this.checkIsAllDay(this.stemIndex, this.document);
      this.stemIndex$.next(this.stemIndex);
    } else {
      this.onStemIndexSelect(0);
    }
  }

  private checkIsAllDay(stemIndex: number, document: DocumentModel) {
    const stemConfig = this.getStemConfig(stemIndex);
    if (stemConfig) {
      const startProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyRequired.StartDate];
      const endProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyOptional.EndDate];

      const start = parseCalendarEventDate(startProperty && document.data[startProperty.attributeId]);
      const end = parseCalendarEventDate(endProperty && document.data[endProperty.attributeId]);
      this.allDay$.next(isAllDayEvent(start, end));
    }
  }

  private getStemConfig(stemIndex: number): CalendarStemConfig {
    return ((this.config && this.config.stemsConfigs) || [])[stemIndex];
  }

  private selectCollectionByStemIndex$(index: number): Observable<Collection> {
    return this.store$.pipe(
      select(selectQuery),
      map(query => ((query && query.stems) || [])[index]),
      mergeMap(stem => (stem && this.store$.pipe(select(selectCollectionById(stem.collectionId)))) || of(null))
    );
  }

  private selectNewDocument$(stemIndex: number): Observable<DocumentModel> {
    return this.selectCollectionByStemIndex$(stemIndex).pipe(
      map(collection => {
        const data = {};

        const stemConfig = this.getStemConfig(stemIndex);
        if (stemConfig) {
          const titleProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyRequired.Name];
          if (titleProperty) {
            data[titleProperty.attributeId] = this.getInitialTitleName();
          }

          const startProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyRequired.StartDate];
          if (startProperty) {
            data[startProperty.attributeId] = this.getInitialEventStart();
          }

          const endProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyOptional.EndDate];
          if (endProperty) {
            data[endProperty.attributeId] = this.getInitialEventEnd();
          }
        }
        return {data, collectionId: collection && collection.id};
      }),
      take(1),
      tap(document => (this.currentDocument = document))
    );
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

  public onDocumentChanged(document: DocumentModel) {
    this.checkIsAllDay(this.stemIndex, document);
    this.currentDocument = document;
  }

  public onAllDayChecked(allDay: boolean) {
    const data = {};
    const stemConfig = this.getStemConfig(this.stemIndex$.value);
    if (stemConfig) {
      const startProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyRequired.StartDate];
      let newStart = null;
      if (startProperty) {
        if (allDay) {
          const start = this.currentDocument.data && this.currentDocument.data[startProperty.attributeId];
          newStart = start && this.cleanDateWhenAllDay(start);
          data[startProperty.attributeId] = newStart;
        } else if (this.initialTime) {
          newStart = this.getInitialEventStart();
          data[startProperty.attributeId] = newStart;
        }
      }

      const endProperty = (stemConfig.barsProperties || {})[CalendarBarPropertyOptional.EndDate];
      if (endProperty) {
        const start = this.currentDocument.data && this.currentDocument.data[endProperty.attributeId];
        if (allDay) {
          data[endProperty.attributeId] = start && this.cleanDateWhenAllDay(start);
        } else if (newStart) {
          data[endProperty.attributeId] = moment(newStart)
            .add(DEFAULT_EVENT_DURATION, 'minutes')
            .toDate();
        }
      }
    }

    if (Object.keys(data).length) {
      this.allDay$.next(allDay);
      this.emitNewDocument(this.currentDocument, data);
    }
  }

  private emitNewDocument(document: DocumentModel, patchData: DocumentData) {
    if (document.id) {
      this.store$.dispatch(new DocumentsAction.PatchData({document: {...document, data: patchData}}));
    } else {
      this.document$ = of({...document, data: {...document.data, ...patchData}});
    }
  }

  public onStemIndexSelect(index: number) {
    this.collection$ = this.selectCollectionByStemIndex$(index);
    this.document$ = this.selectNewDocument$(index);
    this.stemIndex$.next(index);
  }

  private cleanDateWhenAllDay(date: any): Date {
    return moment(date)
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0)
      .toDate();
  }
}
