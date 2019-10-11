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
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ConstraintData} from '../model/data/constraint';
import {selectAllUsers} from '../store/users/users.state';
import {TranslationService} from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class ConstraintDataService {
  constructor(private store$: Store<{}>, private translationService: TranslationService) {}

  public observeConstraintData(): Observable<ConstraintData> {
    // TODO get AddressesMap as well
    return this.store$.pipe(
      select(selectAllUsers),
      map(users => ({users, durationUnitsMap: this.translationService.createDurationUnitsMap()}))
    );
  }
}
