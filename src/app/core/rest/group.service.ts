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

import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import {Group} from '../dto/group';
import {LocalStorage} from '../../shared/utils/local-storage';

const GROUPS_KEY = 'groups';

@Injectable()
export class GroupService {

  public createGroup(group: Group): Observable<string> {
    const groups = LocalStorage.get(GROUPS_KEY) || {};

    group.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    groups[group.id] = group;

    LocalStorage.set(GROUPS_KEY, groups);

    return Observable.of(group.id);
  }

  public updateGroup(id: string, group: Group): Observable<Group> {
    const groups = LocalStorage.get(GROUPS_KEY) || {};

    delete groups[id];
    groups[group.id] = group;

    LocalStorage.set(GROUPS_KEY, groups);

    return Observable.of(group);
  }

  public deleteGroup(id: string): Observable<void> {
    const groups = LocalStorage.get(GROUPS_KEY) || {};

    delete groups[id];

    LocalStorage.set(GROUPS_KEY, groups);

    return Observable.empty();
  }

  public getGroupById(id: string): Observable<Group> {
    const groups = LocalStorage.get(GROUPS_KEY) || {};

    return Observable.of(groups[id]);
  }

  public getGroups(): Observable<Group[]> {
    const groups: { [id: string]: Group } = LocalStorage.get(GROUPS_KEY) || {};

    return Observable.of(Object.values(groups));
  }

}
