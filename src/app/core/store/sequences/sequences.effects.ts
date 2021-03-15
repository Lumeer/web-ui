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
import {of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {catchError, filter, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {AppState} from '../app.state';
import {Router} from '@angular/router';
import {NotificationsAction} from '../notifications/notifications.action';
import {SequencesAction, SequencesActionType} from './sequences.action';
import {selectSequencesLoaded} from './sequences.state';
import {SequenceConverter} from './sequence.converter';
import {SequenceService} from '../../rest/sequence.service';

@Injectable()
export class SequencesEffects {
  public getSequences$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.Get>(SequencesActionType.GET),
      withLatestFrom(this.store$.pipe(select(selectSequencesLoaded))),
      filter(([, loaded]) => !loaded),
      mergeMap(() =>
        this.sequenceService.getSequences().pipe(
          map(
            sequences =>
              new SequencesAction.GetSuccess({
                sequences: SequenceConverter.fromDtos(sequences),
              })
          ),
          catchError(error => of(new SequencesAction.GetFailure({error})))
        )
      )
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.GetFailure>(SequencesActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@sequences.get.fail:Could not read sequences`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.Update>(SequencesActionType.UPDATE),
      mergeMap(action => {
        const sequenceDto = SequenceConverter.toDto(action.payload.sequence);

        return this.sequenceService.updateSequence(sequenceDto).pipe(
          map(dto => SequenceConverter.fromDto(dto)),
          map(sequence => new SequencesAction.UpdateSuccess({sequence})),
          catchError(error => of(new SequencesAction.UpdateFailure({error})))
        );
      })
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.UpdateFailure>(SequencesActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@sequences.update.fail:Could not update sequence`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.Delete>(SequencesActionType.DELETE),
      mergeMap(action => {
        return this.sequenceService.removeSequence(action.payload.sequence.id).pipe(
          map(notificationId => new SequencesAction.DeleteSuccess({id: notificationId})),
          catchError(error => of(new SequencesAction.DeleteFailure({error, id: action.payload.sequence.id})))
        );
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<SequencesAction.DeleteFailure>(SequencesActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@sequence.delete.fail:Could not delete sequence`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private actions$: Actions,
    private sequenceService: SequenceService
  ) {}
}
