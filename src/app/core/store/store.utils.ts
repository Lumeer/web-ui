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

import {Action} from '@ngrx/store';
import {from, Observable} from 'rxjs';
import {CommonAction} from './common/common.action';

export function createCallbackActions<T>(callback: (result: T) => void, result?: T): Action[] {
  return callback ? [new CommonAction.ExecuteCallback({callback: () => callback(result)})] : [];
}

export function emitErrorActions(error: any, onFailure?: (error: any) => void): Observable<Action> {
  const actions: Action[] = [];
  if (onFailure) {
    actions.push(new CommonAction.ExecuteCallback({callback: () => onFailure(error)}));
  }
  return from(actions);
}
