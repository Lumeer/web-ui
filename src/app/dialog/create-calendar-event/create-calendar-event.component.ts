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

import {Component, OnInit, ChangeDetectionStrategy, ViewChild, AfterViewInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, filter, map, mergeMap} from 'rxjs/operators';
import {DialogService} from '../dialog.service';
import {CalendarConfig} from '../../core/store/calendars/calendar.model';
import {concat, Observable, of} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {AppState} from '../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCalendarById} from '../../core/store/calendars/calendars.state';
import {CollectionsPermissionsPipe} from '../../shared/pipes/permissions/collections-permissions.pipe';
import {selectCollectionsByIds} from '../../core/store/collections/collections.state';
import {deepObjectsEquals} from '../../shared/utils/common.utils';
import {CreateCalendarEventFormComponent} from './create-calendar-event-form/create-calendar-event-form.component';
import {DocumentModel} from '../../core/store/documents/document.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';

@Component({
  selector: 'create-calendar-event',
  templateUrl: './create-calendar-event.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCalendarEventComponent implements OnInit, AfterViewInit {
  @ViewChild(CreateCalendarEventFormComponent)
  public formComponent: CreateCalendarEventFormComponent;

  public collections$: Observable<Collection[]>;
  public config$: Observable<CalendarConfig>;
  public initialTime$: Observable<number>;
  public formInvalid$: Observable<boolean>;

  constructor(
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe
  ) {}

  public ngOnInit() {
    this.config$ = this.subscribeConfig();
    this.initialTime$ = this.subscribeInitialTime();
    this.collections$ = this.subscribeWritableCollections();
  }

  private subscribeConfig(): Observable<CalendarConfig> {
    return this.route.paramMap.pipe(
      map(params => params.get('calendarId')),
      filter(calendarId => !!calendarId),
      mergeMap(calendarId => this.store$.pipe(select(selectCalendarById(calendarId)))),
      filter(calendar => !!calendar),
      map(calendar => calendar.config)
    );
  }

  private subscribeInitialTime(): Observable<number> {
    return this.route.paramMap.pipe(
      map(params => params.get('time')),
      filter(time => !!time),
      map(time => +time)
    );
  }

  private subscribeWritableCollections(): Observable<Collection[]> {
    return this.config$.pipe(
      map(config => Object.keys(config.collections)),
      mergeMap(collectionIds => this.store$.pipe(select(selectCollectionsByIds(collectionIds)))),
      mergeMap(collections =>
        this.collectionsPermissionsPipe.transform(collections).pipe(
          distinctUntilChanged((x, y) => deepObjectsEquals(x, y)),
          map(permissions => collections.filter(collection => permissions[collection.id].writeWithView))
        )
      )
    );
  }

  public ngAfterViewInit() {
    const form = this.formComponent.form;
    this.formInvalid$ = concat(of(form.invalid), form.statusChanges.pipe(map(() => form.invalid)));
  }

  public onSubmit() {
    this.formComponent.onSubmit();
  }

  public onCreateEvent(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.Create({document}));
  }
}
