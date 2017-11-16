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

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Store} from '@ngrx/store';

import {LumeerError} from '../error/lumeer.error';
import {Event} from '../dto/Event';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

const EVENTS_KEY = 'events';

// TODO implement on backend
@Injectable()
export class EventService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createEvent(collectionCode: string, event: Event): Observable<string> {
    const collectionKey = `${collectionCode}_${EVENTS_KEY}`;
    const events = LocalStorage.get(collectionKey) || [];

    event.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    events.push(event);

    LocalStorage.set(collectionKey, events);

    return Observable.of(event.id);
  }

  public updateEvent(collectionCode: string, id: string, event: Event): Observable<Event> {
    const collectionKey = `${collectionCode}_${EVENTS_KEY}`;
    const events = LocalStorage.get(collectionKey) || [];

    const updatedEventIndex = events.findIndex(event => id === event.id);
    events[updatedEventIndex] = event;

    LocalStorage.set(collectionKey, events);

    return Observable.of(event);
  }

  public deleteEvent(collectionCode: string, id: string): Observable<void> {
    const collectionKey = `${collectionCode}_${EVENTS_KEY}`;
    const events = LocalStorage.get(collectionKey) || [];

    const deletedEventIndex = events.findIndex(event => id === event.id);
    events.splice(deletedEventIndex, 1);

    LocalStorage.set(collectionKey, events);

    return Observable.empty();
  }

  public getEvents(collectionCode: string): Observable<Event[]> {
    const collectionKey = `${collectionCode}_${EVENTS_KEY}`;
    const events = LocalStorage.get(collectionKey) || [];

    return Observable.of(events);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspace.organizationCode;
    const projectCode = this.workspace.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionCode}/documents`;
  }

  private handleGlobalError(error: HttpErrorResponse): LumeerError {
    throw new LumeerError(error.message);
  }

}
