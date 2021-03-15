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
import {Action, Store} from '@ngrx/store';
import {AppState} from '../app.state';
import {ResourceCommentService} from '../../data-service/resource-comment/resource-comment.service';
import {of} from 'rxjs';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {ResourceCommentsAction, ResourceCommentsActionType} from './resource-comments.action';
import {convertResourceCommentDtoToModel, convertResourceCommentModelToDto} from './resource-comment.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {createCallbackActions} from '../utils/store.utils';
import {DocumentsAction} from '../documents/documents.action';
import {ResourceType} from '../../model/resource-type';
import {LinkInstancesAction} from '../link-instances/link-instances.action';

@Injectable()
export class ResourceCommentsEffects {
  public get$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.Get>(ResourceCommentsActionType.GET),
      mergeMap(action => {
        const {resourceType, resourceId, pageStart, pageLength} = action.payload;
        return this.resourceCommentService.getComments(resourceType, resourceId, pageStart, pageLength).pipe(
          map(dtos => dtos.map(dto => convertResourceCommentDtoToModel(dto))),
          map(comments => new ResourceCommentsAction.GetSuccess({resourceComments: comments})),
          catchError(error => of(new ResourceCommentsAction.GetFailure({error})))
        );
      })
    )
  );

  public getFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.GetFailure>(ResourceCommentsActionType.GET_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@resourceComments.get.fail:Could not read comments`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public create$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public createSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.CreateSuccess>(ResourceCommentsActionType.CREATE_SUCCESS),
      map(action => {
        if (action.payload.comment.resourceType === ResourceType.Document) {
          return new DocumentsAction.GetByIds({documentsIds: [action.payload.comment.resourceId]});
        } else {
          return new LinkInstancesAction.GetByIds({linkInstancesIds: [action.payload.comment.resourceId]});
        }
      })
    )
  );

  public createFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.CreateFailure>(ResourceCommentsActionType.CREATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(action => {
        const errorMessage = $localize`:@@resourceComment.create.fail:Could not save the comment`;
        return new NotificationsAction.Error({message: errorMessage});
      })
    )
  );

  public update$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );

  public updateFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.UpdateFailure>(ResourceCommentsActionType.UPDATE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@resourceComment.update.fail:Could not update the comment`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  public delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.Delete>(ResourceCommentsActionType.DELETE),
      mergeMap(action => {
        return this.resourceCommentService.removeComment(convertResourceCommentModelToDto(action.payload.comment)).pipe(
          map(() => action.payload),
          mergeMap(payload => {
            const actions: Action[] = [new ResourceCommentsAction.DeleteSuccess({comment: action.payload.comment})];

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
    )
  );

  public deleteSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.DeleteSuccess>(ResourceCommentsActionType.DELETE_SUCCESS),
      map(action => {
        if (action.payload.comment.resourceType === ResourceType.Document) {
          return new DocumentsAction.GetByIds({documentsIds: [action.payload.comment.resourceId]});
        } else {
          return new LinkInstancesAction.GetByIds({linkInstancesIds: [action.payload.comment.resourceId]});
        }
      })
    )
  );

  public deleteFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ResourceCommentsAction.DeleteFailure>(ResourceCommentsActionType.DELETE_FAILURE),
      tap(action => console.error(action.payload.error)),
      map(() => {
        const message = $localize`:@@resourceComment.delete.fail:Could not delete the comment`;
        return new NotificationsAction.Error({message});
      })
    )
  );

  constructor(
    private actions$: Actions,
    private resourceCommentService: ResourceCommentService,
    private store$: Store<AppState>
  ) {}
}
