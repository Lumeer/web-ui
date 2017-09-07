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

import {Observable} from 'rxjs/Observable';
import {User} from '../dto/user';
import {WorkspaceService} from '../workspace.service';

@Injectable()
export class UserService {

  constructor(private workspaceService: WorkspaceService) {
  }

  public getUsers(organizationCode?: string): Observable<User[]> {
    if (!organizationCode) {
      organizationCode = this.workspaceService.organizationCode;
    }
    return Observable.of([
      {id: 'someId1', username: 'alicak', groups: []},
      {id: 'someId2', username: 'kubedo', groups: []},
      {id: 'someId3', username: 'jkotrady', groups: []},
      {id: 'someId4', username: 'kulexpipiens', groups: []}]);
  }
}
