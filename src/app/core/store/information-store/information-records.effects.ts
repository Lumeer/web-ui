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
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ResourceCommentsAction} from '../resource-comments/resource-comments.action';
import {catchError, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {of} from 'rxjs';
import {InformationRecordsAction, InformationRecordsActionType} from './information-records.action';
import {select, Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {InformationStoreService} from '../../data-service';
import {convertInformationRecordDtoToInformationRecord} from './information-record.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import {createCallbackActions} from '../utils/store.utils';

@Injectable()
export class InformationRecordsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<InformationRecordsAction.Get>(InformationRecordsActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectWorkspaceWithIds))),
      mergeMap(([action, workspace]) => {
        return this.service.getInformation(workspace.organizationId, action.payload.id).pipe(
          map(dto => convertInformationRecordDtoToInformationRecord(dto)),
          mergeMap(informationRecord => [
            new InformationRecordsAction.GetSuccess({informationRecord}),
            ...createCallbackActions(action.payload.onSuccess, informationRecord),
          ]),
          catchError(error => of(new ResourceCommentsAction.GetFailure({error})))
        );
      })
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<InformationRecordsAction.GetFailure>(InformationRecordsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@information.records.get:Could not get required information`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(private store$: Store<AppState>, private actions$: Actions, private service: InformationStoreService) {}
}
