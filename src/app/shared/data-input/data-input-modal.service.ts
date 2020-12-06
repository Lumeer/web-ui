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

import {Injectable, TemplateRef} from '@angular/core';
import {Store} from '@ngrx/store';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {AppState} from '../../core/store/app.state';
import {ModalsAction} from '../../core/store/modals/modals.action';

type Options = ModalOptions & {initialState: any};

@Injectable({
  providedIn: 'root',
})
export class DataInputModalService {
  constructor(private store$: Store<AppState>, private bsModalService: BsModalService) {}

  public show(content: string | TemplateRef<any> | any, config?: Options): BsModalRef {
    return this.addModalRef(this.bsModalService.show(content, config));
  }

  public showStaticDialog(
    initialState: any,
    content: string | TemplateRef<any> | any,
    classString: string = ''
  ): BsModalRef {
    const config = {initialState, keyboard: false, class: classString};
    config['backdrop'] = 'static';
    return this.show(content, config);
  }

  private addModalRef(modalRef: BsModalRef): BsModalRef {
    this.store$.dispatch(new ModalsAction.Add({modalId: modalRef.id}));
    return modalRef;
  }
}
