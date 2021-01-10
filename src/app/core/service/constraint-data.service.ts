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
import {TranslationService} from './translation.service';
import {ConstraintDataAction} from '../store/constraint-data/constraint-data.action';
import {filter, pairwise, skip, startWith} from 'rxjs/operators';
import {selectConstraintData} from '../store/constraint-data/constraint-data.state';
import {User} from '../store/users/user';
import {isNullOrUndefined, objectsByIdMap} from '../../shared/utils/common.utils';
import {DocumentsAction} from '../store/documents/documents.action';
import {LinkInstancesAction} from '../store/link-instances/link-instances.action';

@Injectable()
export class ConstraintDataService {
  constructor(private store$: Store<{}>, private translationService: TranslationService) {}

  public init(): Promise<boolean> {
    const durationUnitsMap = this.translationService.createDurationUnitsMap();
    this.store$.dispatch(new ConstraintDataAction.InitDurationUnitsMap({durationUnitsMap}));
    this.checkConstraintDataChange();
    return Promise.resolve(true);
  }

  private checkConstraintDataChange() {
    this.store$
      .pipe(
        select(selectConstraintData),
        skip(1),
        startWith(null),
        pairwise(),
        filter(([previousConstraintData]) => !!previousConstraintData)
      )
      .subscribe(([previousConstraintData, currentConstraintData]) => {
        if (
          usersChanged(previousConstraintData?.users, currentConstraintData?.users) ||
          userChanged(previousConstraintData?.currentUser, currentConstraintData?.currentUser)
        ) {
          this.store$.dispatch(new DocumentsAction.TransformDataValues({}));
          this.store$.dispatch(new LinkInstancesAction.TransformDataValues({}));
        }
      });
  }
}

function usersChanged(previousUsers: User[], currentUsers: User[]): boolean {
  if (previousUsers?.length !== currentUsers?.length) {
    return true;
  }
  const previousUsersMap = objectsByIdMap(previousUsers);
  return currentUsers.some(currentUser => userChanged(previousUsersMap[currentUser.id], currentUser));
}

function userChanged(previousUser: User, currentUser: User): boolean {
  if (isNullOrUndefined(previousUser) !== isNullOrUndefined(currentUser)) {
    return true;
  }
  return previousUser?.email !== currentUser?.email || previousUser?.name !== currentUser?.name;
}
