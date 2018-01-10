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
import {isNullOrUndefined} from 'util';
import {SmartDocTemplateDto} from '../../dto/smartdoc-template.dto';
import {SmartDocTemplateService} from '../../rest/smartdoc-template.service';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {SmartDocTemplateConverter} from './smartdoc-template.converter';
import {SmartDocTemplateModel} from './smartdoc-template.model';
import {SmartDocTemplatesAction, SmartDocTemplatesActionType} from './smartdoc-templates.action';
import {selectSmartDocTemplatesDictionary} from './smartdoc-templates.state';

@Injectable()
export class SmartDocTemplatesEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.GET).pipe(
    map((action: SmartDocTemplatesAction.Get) => action.payload.templateId),
    withLatestFrom(this.store$.select(selectSmartDocTemplatesDictionary)),
    skipWhile(([templateId, templates]) => templates.hasOwnProperty(templateId)),
    switchMap(([templateId]) => this.templateService.getTemplatesById(templateId).pipe(
      map(dtos => dtos.map(dto => SmartDocTemplateConverter.fromDto(dto)))
    )),
    map((templates) => new SmartDocTemplatesAction.GetSuccess({templates: templates})),
    catchError((error) => Observable.of(new SmartDocTemplatesAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.GetFailure>(SmartDocTemplatesActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get template'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.Create>(SmartDocTemplatesActionType.CREATE).pipe(
    switchMap((action) => {
      const templateDto = SmartDocTemplateConverter.toDto(action.payload.template);

      return this.templateService.createTemplate(templateDto).pipe(
        map(dto => SmartDocTemplateConverter.fromDto(dto, action.payload.template.correlationId))
      );
    }),
    map((template: SmartDocTemplateModel) => new SmartDocTemplatesAction.CreateSuccess({template: template})),
    catchError((error) => Observable.of(new SmartDocTemplatesAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.CreateFailure>(SmartDocTemplatesActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create template'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.Update>(SmartDocTemplatesActionType.UPDATE).pipe(
    switchMap(action => {
      const templateDto = SmartDocTemplateConverter.toDto(action.payload.template);

      return this.templateService.updateTemplate(templateDto).pipe(
        map((dto: SmartDocTemplateDto) => SmartDocTemplateConverter.fromDto(dto))
      );
    }),
    map((template: SmartDocTemplateModel) => new SmartDocTemplatesAction.UpdateSuccess({template: template})),
    catchError((error) => Observable.of(new SmartDocTemplatesAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.UpdateFailure>(SmartDocTemplatesActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update template'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.DELETE).pipe(
    switchMap((action: SmartDocTemplatesAction.Delete) => this.templateService.deleteTemplate(action.payload.templateId)),
    map((templateId: string) => new SmartDocTemplatesAction.DeleteSuccess({templateId: templateId})),
    catchError((error) => Observable.of(new SmartDocTemplatesAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<SmartDocTemplatesAction.DeleteFailure>(SmartDocTemplatesActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete template'}))
  );

  @Effect()
  public addPart$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.ADD_PART).pipe(
    withLatestFrom(this.store$.select(selectSmartDocTemplatesDictionary)),
    map(([action, dictionary]: [SmartDocTemplatesAction.AddPart, { [templateId: string]: SmartDocTemplateModel }]) => {
      const template: SmartDocTemplateModel = {...dictionary[action.payload.templateId]};

      if (!isNullOrUndefined(action.payload.partIndex)) {
        const templateParts = [...template.parts];
        templateParts.splice(action.payload.partIndex, 0, action.payload.part);
        template.parts = templateParts;
      } else {
        template.parts = template.parts.concat(action.payload.part);
      }
      return new SmartDocTemplatesAction.Update({template: template});
    })
  );

  @Effect()
  public updatePart$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.UPDATE_PART).pipe(
    withLatestFrom(this.store$.select(selectSmartDocTemplatesDictionary)),
    map(([action, dictionary]: [SmartDocTemplatesAction.UpdatePart, { [templateId: string]: SmartDocTemplateModel }]) => {
      const template: SmartDocTemplateModel = {...dictionary[action.payload.templateId]};
      template.parts = template.parts.slice();
      template.parts.splice(action.payload.partIndex, 1, action.payload.part);
      return new SmartDocTemplatesAction.Update({template: template});
    })
  );

  @Effect()
  public removePartConfirm$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.REMOVE_PART_CONFIRM).pipe(
    map((action: SmartDocTemplatesAction.RemovePartConfirm) => new NotificationsAction.Confirm({
      title: 'Remove part',
      message: 'Do you really want to remove this template part?',
      action: new SmartDocTemplatesAction.RemovePart(action.payload)
    }))
  );

  @Effect()
  public removePart$: Observable<Action> = this.actions$.ofType(SmartDocTemplatesActionType.REMOVE_PART).pipe(
    withLatestFrom(this.store$.select(selectSmartDocTemplatesDictionary)),
    map(([action, dictionary]: [SmartDocTemplatesAction.RemovePart, { [templateId: string]: SmartDocTemplateModel }]) => {
      const template: SmartDocTemplateModel = {...dictionary[action.payload.templateId]};
      template.parts = template.parts.slice();
      template.parts.splice(action.payload.partIndex, 1);
      return new SmartDocTemplatesAction.Update({template: template});
    })
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private templateService: SmartDocTemplateService) {
  }
}
