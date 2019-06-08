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

import {Component, OnInit, ChangeDetectionStrategy, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {distinctUntilChanged, filter, map, mergeMap} from 'rxjs/operators';
import {DialogService} from '../dialog.service';
import {CalendarConfig} from '../../core/store/calendars/calendar.model';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {AppState} from '../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCalendarById} from '../../core/store/calendars/calendars.state';
import {CollectionsPermissionsPipe} from '../../shared/pipes/permissions/collections-permissions.pipe';
import {selectCollectionById, selectCollectionsByIds} from '../../core/store/collections/collections.state';
import {deepObjectsEquals} from '../../shared/utils/common.utils';
import {CalendarEventDialogFormComponent} from './form/calendar-event-dialog-form.component';
import {DocumentModel} from '../../core/store/documents/document.model';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {Query} from '../../core/store/navigation/query';
import {selectQuery} from '../../core/store/navigation/navigation.state';
import {User} from '../../core/store/users/user';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {AllowedPermissions} from '../../core/model/allowed-permissions';

@Component({
  templateUrl: './calendar-event-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEventDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CalendarEventDialogFormComponent)
  public formComponent: CalendarEventDialogFormComponent;

  public collections$: Observable<Collection[]>;
  public config$: Observable<CalendarConfig>;
  public initialTime$: Observable<number>;
  public document$: Observable<DocumentModel>;
  public update$: Observable<boolean>;
  public query$: Observable<Query>;
  public currentUser$: Observable<User>;
  public formInvalid$ = new BehaviorSubject(true);
  public collectionsPermissions$: Observable<Record<string, AllowedPermissions>>;

  private subscriptions = new Subscription();

  constructor(
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe
  ) {}

  public ngOnInit() {
    this.config$ = this.subscribeConfig();
    this.initialTime$ = this.subscribeInitialTime();
    this.document$ = this.subscribeDocument();
    const configCollections$ = this.config$.pipe(
      map(config => Object.keys(config.collections)),
      mergeMap(collectionIds => this.store$.pipe(select(selectCollectionsByIds(collectionIds))))
    );
    this.collectionsPermissions$ = configCollections$.pipe(
      mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
    this.collections$ = this.subscribeWritableCollections(configCollections$);
    this.update$ = this.document$.pipe(map(document => !!document));
    this.query$ = this.store$.pipe(select(selectQuery));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
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

  private subscribeWritableCollections(configCollections$: Observable<Collection[]>): Observable<Collection[]> {
    return this.document$.pipe(
      mergeMap(
        document =>
          (document && this.subscribeCollectionsByDocument(document)) ||
          this.subscribeCollectionsByConfig(configCollections$)
      )
    );
  }

  private subscribeCollectionsByDocument(document: DocumentModel) {
    return this.store$.pipe(select(selectCollectionById(document.collectionId))).pipe(map(collection => [collection]));
  }

  private subscribeCollectionsByConfig(configCollections$: Observable<Collection[]>): Observable<Collection[]> {
    return configCollections$.pipe(
      mergeMap(collections =>
        this.collectionsPermissions$.pipe(
          map(permissions => collections.filter(collection => permissions[collection.id].writeWithView))
        )
      )
    );
  }

  public subscribeDocument(): Observable<DocumentModel> {
    return this.route.paramMap.pipe(
      map(params => params.get('documentId')),
      mergeMap(documentId => this.getDocumentById(documentId))
    );
  }

  private getDocumentById(documentId: string): Observable<DocumentModel> {
    if (!documentId) {
      return of(null);
    }
    return this.store$.pipe(select(selectDocumentById(documentId)));
  }

  public ngAfterViewInit() {
    const form = this.formComponent.form;
    setTimeout(() => this.formInvalid$.next(form.invalid));
    this.subscriptions.add(form.statusChanges.subscribe(() => this.formInvalid$.next(form.invalid)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    this.formComponent.onSubmit();
  }

  public onCreateEvent(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.Create({document}));
  }

  public onUpdateEvent(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }
}
