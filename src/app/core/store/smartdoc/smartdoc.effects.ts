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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {flatMap, map, withLatestFrom} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {SmartDocUtils} from '../../../view/perspectives/smartdoc/smartdoc.utils';
import {AppState} from '../app.state';
import {NotificationsAction} from '../notifications/notifications.action';
import {ViewsAction} from '../views/views.action';
import {selectViewSmartDocConfig} from '../views/views.state';
import {SmartDocAction, SmartDocActionType} from './smartdoc.action';
import {SmartDocModel} from './smartdoc.model';

@Injectable()
export class SmartDocEffects {

  @Effect()
  public addPart$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.AddPart>(SmartDocActionType.ADD_PART),
    withLatestFrom(this.store$.select(selectViewSmartDocConfig)),
    map(([action, smartDocConfig]) => {
      const config = SmartDocEffects.modifyInnerSmartDoc(smartDocConfig, action.payload.partPath, innerSmartDoc => {
        if (!isNullOrUndefined(action.payload.partIndex)) {
          innerSmartDoc.parts.splice(action.payload.partIndex, 0, action.payload.part);
        } else {
          innerSmartDoc.parts = innerSmartDoc.parts.concat(action.payload.part);
        }
        return innerSmartDoc;
      });
      return new ViewsAction.ChangeSmartDocConfig({config});
    })
  );

  @Effect()
  public updatePart$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.UpdatePart>(SmartDocActionType.UPDATE_PART),
    withLatestFrom(this.store$.select(selectViewSmartDocConfig)),
    map(([action, smartDocConfig]) => {
      const config = SmartDocEffects.modifyInnerSmartDoc(smartDocConfig, action.payload.partPath, innerSmartDoc => {
        innerSmartDoc.parts.splice(action.payload.partIndex, 1, action.payload.part);
        return innerSmartDoc;
      });
      return new ViewsAction.ChangeSmartDocConfig({config});
    })
  );

  @Effect()
  public removePart$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.RemovePart>(SmartDocActionType.REMOVE_PART),
    withLatestFrom(this.store$.select(selectViewSmartDocConfig)),
    flatMap(([action, smartDocConfig]) => {
      const config = SmartDocEffects.modifyInnerSmartDoc(smartDocConfig, action.payload.partPath, innerSmartDoc => {
        innerSmartDoc.parts.splice(action.payload.partIndex, 1);
        return innerSmartDoc;
      });

      const actions: Action[] = [new ViewsAction.ChangeSmartDocConfig({config})];
      if (action.payload.last) {
        const part = SmartDocUtils.createEmptyTextPart();
        actions.push(new SmartDocAction.AddPart({partPath: action.payload.partPath, part}));
      }
      return actions;
    })
  );

  @Effect()
  public removePartConfirm$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.RemovePartConfirm>(SmartDocActionType.REMOVE_PART_CONFIRM),
    map((action: SmartDocAction.RemovePartConfirm) => {
      const title = this.i18n({id: 'smartdoc.remove.part.dialog.title', value: 'Remove part'});
      const message = this.i18n({id: 'smartdoc.remove.part.dialog.message', value: 'Do you really want to remove this template part?'});

      return new NotificationsAction.Confirm({
        title,
        message,
        action: new SmartDocAction.RemovePart(action.payload)
      });
    })
  );

  @Effect()
  public movePart$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.MovePart>(SmartDocActionType.MOVE_PART),
    withLatestFrom(this.store$.select(selectViewSmartDocConfig)),
    map(([action, smartDocConfig]) => {
      const config = SmartDocEffects.modifyInnerSmartDoc(smartDocConfig, action.payload.partPath, innerSmartDoc => {
        innerSmartDoc.parts.splice(action.payload.newIndex, 0, innerSmartDoc.parts.splice(action.payload.oldIndex, 1)[0]);
        return innerSmartDoc;
      });
      return new ViewsAction.ChangeSmartDocConfig({config});
    })
  );

  @Effect()
  public orderDocuments$: Observable<Action> = this.actions$.pipe(
    ofType<SmartDocAction.OrderDocuments>(SmartDocActionType.ORDER_DOCUMENTS),
    withLatestFrom(this.store$.select(selectViewSmartDocConfig)),
    map(([action, smartDocConfig]) => {
      const config = SmartDocEffects.modifyInnerSmartDoc(smartDocConfig, action.payload.partPath, innerSmartDoc => {
        innerSmartDoc.documentIdsOrder = action.payload.documentIds;
        return innerSmartDoc;
      });
      return new ViewsAction.ChangeSmartDocConfig({config});
    })
  );

  constructor(private actions$: Actions,
              private i18n: I18n,
              private store$: Store<AppState>) {
  }

  private static modifyInnerSmartDoc(smartDoc: SmartDocModel, path: number[], modify: (inner: SmartDocModel) => SmartDocModel): SmartDocModel {
    if (path.length === 0) {
      return modify({...smartDoc, parts: [...smartDoc.parts]});
    }

    const index = path[0];

    const part = {...smartDoc.parts[index]};
    part.smartDoc = SmartDocEffects.modifyInnerSmartDoc(part.smartDoc, path.slice(1), modify);

    const modifiedSmartDoc = {...smartDoc, parts: [...smartDoc.parts]};
    modifiedSmartDoc.parts.splice(index, 1, part);

    return modifiedSmartDoc;
  }

}
