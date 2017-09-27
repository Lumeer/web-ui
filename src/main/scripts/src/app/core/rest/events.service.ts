/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';

import {ErrorObservable} from 'rxjs/observable/ErrorObservable';
import {LumeerError} from '../error/lumeer.error';
import {WorkspaceService} from '../workspace.service';
import {Observable} from 'rxjs/Observable';
import {Event} from '../dto/Event';

// TODO implement on backend
@Injectable()
export class EventsService {

  public static event1: Event = {
    fireWhen: ['New Document', 'Document Edit', 'Document Removal'],
    callback: 'Update Automatic Links',
    parameters: ['Document Stickyness = yes']
  };

  public static event2: Event = {
    fireWhen: ['New Document', 'Document Edit', 'Document Removal'],
    callback: 'Update Automatic Links',
    parameters: ['Document Stickyness = yes']
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
