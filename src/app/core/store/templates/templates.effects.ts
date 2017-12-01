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
import {Actions, Effect} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, skipWhile, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {TemplateDto} from '../../dto/template.dto';
import {TemplateService} from '../../rest/template.service';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {TemplateConverter} from './template.converter';
import {mergeTextParts, TemplateModel} from './template.model';
import {TemplatesAction, TemplatesActionType} from './templates.action';
import {selectTemplatesDictionary} from './templates.state';

@Injectable()
export class TemplatesEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType(TemplatesActionType.GET).pipe(
    map((action: TemplatesAction.Get) => action.payload.templateId),
    withLatestFrom(this.store$.select(selectTemplatesDictionary)),
    skipWhile(([templateId, templates]) => templates.hasOwnProperty(templateId)),
    switchMap(([templateId, dictionary]) => this.templateService.getTemplatesById(templateId).pipe(
      map(dtos => dtos.map(dto => TemplateConverter.fromDto(dto)))
    )),
    map((templates: TemplateModel[]) => new TemplatesAction.GetSuccess({templates: templates})),
    catchError((error) => Observable.of(new TemplatesAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<TemplatesAction.GetFailure>(TemplatesActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to get template'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<TemplatesAction.Create>(TemplatesActionType.CREATE).pipe(
    switchMap((action) => {
      const templateDto = TemplateConverter.toDto(action.payload.template);

      return this.templateService.createTemplate(templateDto).pipe(
        map(dto => TemplateConverter.fromDto(dto, action.payload.template.correlationId))
      );
    }),
    map((template: TemplateModel) => new TemplatesAction.CreateSuccess({template: template})),
    catchError((error) => Observable.of(new TemplatesAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<TemplatesAction.CreateFailure>(TemplatesActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to create template'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<TemplatesAction.Update>(TemplatesActionType.UPDATE).pipe(
    switchMap(action => {
      const templateDto = TemplateConverter.toDto(action.payload.template);

      return this.templateService.updateTemplate(templateDto).pipe(
        map((dto: TemplateDto) => TemplateConverter.fromDto(dto))
      );
    }),
    map((template: TemplateModel) => new TemplatesAction.UpdateSuccess({template: template})),
    catchError((error) => Observable.of(new TemplatesAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<TemplatesAction.UpdateFailure>(TemplatesActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to update template'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType(TemplatesActionType.DELETE).pipe(
    switchMap((action: TemplatesAction.Delete) => this.templateService.deleteTemplate(action.payload.templateId)),
    map((templateId: string) => new TemplatesAction.DeleteSuccess({templateId: templateId})),
    catchError((error) => Observable.of(new TemplatesAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<TemplatesAction.DeleteFailure>(TemplatesActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to delete template'}))
  );

  @Effect()
  public addPart$: Observable<Action> = this.actions$.ofType(TemplatesActionType.ADD_PART).pipe(
    withLatestFrom(this.store$.select(selectTemplatesDictionary)),
    map(([action, dictionary]: [TemplatesAction.AddPart, { [templateId: string]: TemplateModel }]) => {
      const template: TemplateModel = {...dictionary[action.payload.templateId]};
      template.parts = template.parts.concat(action.payload.part);
      return new TemplatesAction.Update({template: template});
    })
  );

  @Effect()
  public updatePart$: Observable<Action> = this.actions$.ofType(TemplatesActionType.UPDATE_PART).pipe(
    withLatestFrom(this.store$.select(selectTemplatesDictionary)),
    map(([action, dictionary]: [TemplatesAction.UpdatePart, { [templateId: string]: TemplateModel }]) => {
      const template: TemplateModel = {...dictionary[action.payload.templateId]};
      template.parts = template.parts.slice();
      template.parts.splice(action.payload.partIndex, 1, action.payload.part);
      return new TemplatesAction.Update({template: template});
    })
  );

  @Effect()
  public removePart$: Observable<Action> = this.actions$.ofType(TemplatesActionType.REMOVE_PART).pipe(
    withLatestFrom(this.store$.select(selectTemplatesDictionary)),
    map(([action, dictionary]: [TemplatesAction.RemovePart, { [templateId: string]: TemplateModel }]) => {
      const template: TemplateModel = {...dictionary[action.payload.templateId]};
      template.parts = template.parts.slice();
      template.parts.splice(action.payload.partIndex, 1);
      mergeTextParts(template.parts);
      return new TemplatesAction.Update({template: template});
    })
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private templateService: TemplateService) {
  }
}
