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

import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LumeerError} from '../error/lumeer.error';
import {WorkspaceService} from '../workspace.service';
import {Observable} from 'rxjs/Observable';
import {EventFireReason} from '../../collection/config/events/event-fire-reason';
import {sortByAttribute, updateAutomaticLinks} from '../../collection/config/events/event-callback';
import {ascending, documentStickyness} from '../../collection/config/events/event-parameter';
import {Event} from '../dto/Event';

// TODO implement on backend
@Injectable()
export class EventsService {

  public static event1: Event = {
    fireWhen: [EventFireReason.documentCreate, EventFireReason.documentEdit, EventFireReason.documentRemove],
    callback: updateAutomaticLinks,
    parameters: [documentStickyness],
    automatic: true
  };

  public static event2: Event = {
    fireWhen: [EventFireReason.documentEdit],
    callback: {
      name: sortByAttribute.name,
      hasValue: sortByAttribute.hasValue,
      value: 'dateoforder'
    },
    parameters: [ascending, {
      name: documentStickyness.name,
      value: documentStickyness.possibleValues[1],
      possibleValues: documentStickyness.possibleValues
    }]
  };

  constructor(private httpClient: HttpClient,
              private workspaceService: WorkspaceService) {
  }

  public getEvents(collectionCode: string): Observable<Event[]> {
    return Observable.of([EventsService.event1, EventsService.event2]);
  }

  private apiPrefix(collectionCode: string): string {
    const organizationCode = this.workspaceService.organizationCode;
    const projectCode = this.workspaceService.projectCode;

    return `/${API_URL}/rest/organizations/${organizationCode}/projects/${projectCode}/collections/${collectionCode}/documents`;
  }

  private handleGlobalError(error: HttpErrorResponse): ErrorObservable {
    throw new LumeerError(error.message);
  }

}
