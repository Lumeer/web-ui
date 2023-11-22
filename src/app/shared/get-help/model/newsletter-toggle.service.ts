/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Store} from '@ngrx/store';

import {UpdateValueService} from '../../../core/service/update-value.service';
import {AppState} from '../../../core/store/app.state';
import {User} from '../../../core/store/users/user';
import {UsersAction} from '../../../core/store/users/users.action';

@Injectable()
export class NewsletterToggleService extends UpdateValueService<boolean, User> {
  constructor(private store$: Store<AppState>) {
    super();
  }

  public shouldUnsubscribePendingUpdate(previousValue: boolean, currentValue: boolean): boolean {
    return previousValue !== currentValue;
  }

  public processUpdate(id: string, value: boolean, data?: User) {
    this.store$.dispatch(new UsersAction.PatchCurrentUser({user: {newsletter: value}}));
  }

  public processUpdateToStore(id: string, value: boolean, data?: User) {
    // not needed
  }
}
