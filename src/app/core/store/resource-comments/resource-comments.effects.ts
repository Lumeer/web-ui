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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Action, Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {ResourceCommentService} from '../../data-service/resource-comment/resource-comment.service';
import {Observable, of} from 'rxjs';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {ResourceCommentsAction, ResourceCommentsActionType} from './resource-comments.action';
import {convertResourceCommentDtoToModel, convertResourceCommentModelToDto} from './resource-comment.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {createCallbackActions} from '../store.utils';

@Injectable()
export class ResourceCommentsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.Get>(ResourceCommentsActionType.GET),
    mergeMap(action => {
      const {resourceType, resourceId, pageStart, pageLength} = action.payload;
      return this.resourceCommentService.getComments(resourceType, resourceId, pageStart, pageLength).pipe(
        map(dtos => dtos.map(dto => convertResourceCommentDtoToModel(dto))),
        map(comments => new ResourceCommentsAction.GetSuccess({resourceComments: comments})),
        catchError(error => of(new ResourceCommentsAction.GetFailure({error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.GetFailure>(ResourceCommentsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'resourceComments.get.fail', value: 'Could not read comments'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.Create>(ResourceCommentsActionType.CREATE),
    mergeMap(action => {
      const {correlationId} = action.payload.comment;
      const commentDto = convertResourceCommentModelToDto(action.payload.comment);
      return this.resourceCommentService.createComment(commentDto).pipe(
        map(dto => convertResourceCommentDtoToModel(dto, correlationId)),
        mergeMap(comment => {
          return [
            ...createCallbackActions(action.payload.onSuccess, comment.id),
            new ResourceCommentsAction.CreateSuccess({comment}),
          ];
        }),
        catchError(error =>
          of(
            ...createCallbackActions(action.payload.onFailure),
            new ResourceCommentsAction.CreateFailure({correlationId, error})
          )
        )
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.CreateFailure>(ResourceCommentsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(action => {
      const errorMessage = this.i18n({id: 'resourceComment.create.fail', value: 'Could not save the comment'});
      return new NotificationsAction.Error({message: errorMessage});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.Update>(ResourceCommentsActionType.UPDATE),
    mergeMap(action => {
      return this.resourceCommentService.updateComment(convertResourceCommentModelToDto(action.payload.comment)).pipe(
        map(dto => convertResourceCommentDtoToModel(dto)),
        map(comment => new ResourceCommentsAction.UpdateSuccess({comment, originalComment: action.payload.comment})),
        catchError(error =>
          of(new ResourceCommentsAction.UpdateFailure({error, originalComment: action.payload.comment}))
        )
      );
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.UpdateFailure>(ResourceCommentsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'resourceComment.update.fail', value: 'Could not update the comment'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.Delete>(ResourceCommentsActionType.DELETE),
    mergeMap(action => {
      return this.resourceCommentService.removeComment(convertResourceCommentModelToDto(action.payload.comment)).pipe(
        map(() => action.payload),
        mergeMap(payload => {
          const actions: Action[] = [new ResourceCommentsAction.DeleteSuccess({commentId: action.payload.comment.id})];

          if (payload.nextAction) {
            actions.push(payload.nextAction);
          }

          return actions;
        }),
        catchError(error =>
          of(new ResourceCommentsAction.DeleteFailure({error, originalComment: action.payload.comment}))
        )
      );
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<ResourceCommentsAction.DeleteFailure>(ResourceCommentsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'resourceComment.delete.fail', value: 'Could not delete the comment'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private resourceCommentService: ResourceCommentService,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {}
}
