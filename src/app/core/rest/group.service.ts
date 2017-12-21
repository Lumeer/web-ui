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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import 'rxjs/add/observable/of';
import {Observable} from 'rxjs/Observable';
import {LocalStorage} from '../../shared/utils/local-storage';
import {Group} from '../dto';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {Workspace} from '../store/navigation/workspace.model';

@Injectable()
export class GroupService {

  private workspace: Workspace;

  constructor(private httpClient: HttpClient,
              private store: Store<AppState>) {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);
  }

  public createGroup(group: Group): Observable<Group> {
    const groups = LocalStorage.get(this.webStorageKey()) || {};

    group.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    groups[group.id] = group;

    LocalStorage.set(this.webStorageKey(), groups);

    return Observable.of(group);
  }

  public updateGroup(id: string, group: Group): Observable<Group> {
    const groups = LocalStorage.get(this.webStorageKey()) || {};

    delete groups[id];
    groups[group.id] = group;

    LocalStorage.set(this.webStorageKey(), groups);

    return Observable.of(group);
  }

  public deleteGroup(id: string): Observable<void> {
    const groups = LocalStorage.get(this.webStorageKey()) || {};

    delete groups[id];

    LocalStorage.set(this.webStorageKey(), groups);

    return Observable.empty();
  }

  public getGroupById(id: string): Observable<Group> {
    const groups = LocalStorage.get(this.webStorageKey()) || {};

    return Observable.of(groups[id]);
  }

  public getGroups(): Observable<Group[]> {
    const groups: { [id: string]: Group } = LocalStorage.get(this.webStorageKey()) || {};

    return Observable.of(Object.values(groups));
  }

  private webStorageKey(): string {
    return `groups-${this.workspace.organizationCode}`;
  }

  private apiPrefix(): string {
    return `/${API_URL}/rest/organizations/${this.workspace.organizationCode}/groups`;
  }

}
