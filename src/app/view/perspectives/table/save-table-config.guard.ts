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
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {DEFAULT_TABLE_ID} from '../../../core/store/tables/table.model';
import {TablesAction} from '../../../core/store/tables/tables.action';
import {TablePerspectiveComponent} from './table-perspective.component';

@Injectable({
  providedIn: 'root'
})
export class SaveTableConfigGuard implements CanDeactivate<TablePerspectiveComponent> {

  constructor(private store$: Store<AppState>) {
  }

  public canDeactivate(component: TablePerspectiveComponent,
                       currentRoute: ActivatedRouteSnapshot,
                       currentState: RouterStateSnapshot,
                       nextState?: RouterStateSnapshot): boolean {
    this.store$.dispatch(new TablesAction.SaveConfig({
      cursor: {
        tableId: DEFAULT_TABLE_ID,
        partIndex: 0
      }
    }));
    return true;
  }

}
