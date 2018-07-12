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

import {Pipe, PipeTransform} from '@angular/core';
import {areQueriesEqual} from '../../core/store/navigation/query.helper';
import {QueryModel} from '../../core/store/navigation/query.model';
import {ViewConfigModel, ViewModel} from '../../core/store/views/view.model';
import {Perspective} from '../perspectives/perspective';
import {PermissionsPipe} from '../../shared/pipes/permissions.pipe';
import {Observable, of, combineLatest as observableCombineLatest} from 'rxjs';
import {Role} from '../../core/model/role';
import {map} from 'rxjs/operators';

@Pipe({
  name: 'viewControlsInfo'
})
export class ViewControlsInfoPipe implements PipeTransform {

  constructor(private permissionsPipe: PermissionsPipe) {
  }

  public transform(view: ViewModel, name: string, config: ViewConfigModel, perspective: Perspective, query: QueryModel)
    : Observable<{ viewChanged: boolean, canClone: boolean, canManage: boolean, canShare: boolean }> {
    if (!view || !view.code) {
      return of({viewChanged: !!name, canClone: false, canManage: true, canShare: false});
    }

    const viewChanged = isNameChanged(view, name) || isConfigChanged(view, config, perspective) || isQueryChanged(view, query);

    return observableCombineLatest(this.permissionsPipe.transform(view, Role.Clone),
      this.permissionsPipe.transform(view, Role.Manage),
      this.permissionsPipe.transform(view, Role.Share)).pipe(
      map(([canClone, canManage, canShare]) => ({viewChanged, canClone, canManage, canShare}))
    );
  }

}

function isNameChanged(view: ViewModel, name: string): boolean {
  return view.name !== name;
}

function isConfigChanged(view: ViewModel, config: ViewConfigModel, perspective: Perspective): boolean {
  return JSON.stringify(config[perspective]) !== JSON.stringify(view.config[perspective]);
}

function isQueryChanged(view: ViewModel, query: QueryModel): boolean {
  return !areQueriesEqual(view.query, query);
}
