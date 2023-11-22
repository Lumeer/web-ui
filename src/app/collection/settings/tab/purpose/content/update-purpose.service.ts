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

import {deepObjectsEquals} from '@lumeer/utils';

import {UpdateValueService} from '../../../../../core/service/update-value.service';
import {AppState} from '../../../../../core/store/app.state';
import {Collection, CollectionPurpose} from '../../../../../core/store/collections/collection';
import {CollectionsAction} from '../../../../../core/store/collections/collections.action';

@Injectable()
export class UpdatePurposeService extends UpdateValueService<CollectionPurpose, Collection> {
  constructor(private store$: Store<AppState>) {
    super(2000);
  }

  public shouldUnsubscribePendingUpdate(previousValue: CollectionPurpose, currentValue: CollectionPurpose): boolean {
    return false;
  }

  public processUpdate(id: string, value: CollectionPurpose, data: Collection) {
    if (!deepObjectsEquals(value, data.purpose)) {
      this.store$.dispatch(
        new CollectionsAction.UpdatePurpose({
          collectionId: id,
          purpose: value,
          workspace: this.workspace,
        })
      );
    }
  }

  public processUpdateToStore(id: string, value: CollectionPurpose) {
    // nothing to do now
  }
}
