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
import {Observable} from 'rxjs';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {map, take, tap} from 'rxjs/operators';
import {ModalsAction, ModalsActionType} from './modals.action';
import {AppState} from '../app.state';
import {selectModalsIds} from './modals.state';
import {ToastrService} from 'ngx-toastr';
import {BsModalService} from 'ngx-bootstrap/modal';

@Injectable()
export class ModalsEffects {
  public hide$ = createEffect(() =>
    this.actions$.pipe(
      ofType<ModalsAction.Hide>(ModalsActionType.HIDE),
      tap(() => {
        this.toastrService.toasts.forEach(toast => toast.toastRef.close());
        this.store$
          .pipe(select(selectModalsIds), take(1))
          .subscribe(modalsIds => modalsIds.forEach(modalId => this.modalService.hide(modalId)));
      }),
      map(() => new ModalsAction.Clear())
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>,
    private modalService: BsModalService,
    private toastrService: ToastrService
  ) {}
}
