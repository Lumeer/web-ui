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
import {User} from '../dto/user';
import {LocalStorage} from '../../shared/utils/local-storage';

const USERS_KEY = 'users';

@Injectable()
export class UserService {

  public createUser(user: User): Observable<string> {
    const users = LocalStorage.get(USERS_KEY) || {};

    user.id = String(Math.floor(Math.random() * 1000000000000000) + 1);
    users[user.id] = user;

    LocalStorage.set(USERS_KEY, users);

    return Observable.of(user.id);
  }

  public updateUser(id: string, user: User): Observable<User> {
    const users = LocalStorage.get(USERS_KEY) || {};

    delete users[id];
    users[user.id] = user;

    LocalStorage.set(USERS_KEY, users);

    return Observable.of(user);
  }

  public deleteUser(id: string): Observable<void> {
    const users = LocalStorage.get(USERS_KEY) || {};

    delete users[id];

    LocalStorage.set(USERS_KEY, users);

    return Observable.empty();
  }

  public getUserById(id: string): Observable<User[]> {
    const users = LocalStorage.get(USERS_KEY) || {};

    return Observable.of(users[id]);
  }

  public getUsers(): Observable<User[]> {
    const users: { [id: string]: User } = LocalStorage.get(USERS_KEY) || {};

    return Observable.of(Object.values(users));
  }

}
