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
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {map, take} from 'rxjs/operators';
import {Perspective} from '../../view/perspectives/perspective';
import {AppState} from '../store/app.state';
import {selectWorkspace} from '../store/navigation/navigation.state';
import {QueryParam} from '../store/navigation/query-param';
import {convertViewCursorToString, ViewCursor} from '../store/navigation/view-cursor/view-cursor';
import {combineLatest, Observable} from 'rxjs';
import {Query} from '../store/navigation/query/query';
import {selectCollectionsByQueryWithoutLinks} from '../store/common/permissions.selectors';
import {modifyDetailPerspectiveQuery} from '../store/details/detail.utils';
import {selectViewDataQuery} from '../store/view-settings/view-settings.state';

@Injectable({
  providedIn: 'root',
})
export class PerspectiveService {
  constructor(private store$: Store<AppState>, private router: Router) {}

  public selectQuery$(perspective: Perspective): Observable<Query> {
    switch (perspective) {
      case Perspective.Detail:
        return combineLatest([
          this.store$.pipe(select(selectCollectionsByQueryWithoutLinks)),
          this.store$.pipe(select(selectViewDataQuery)),
        ]).pipe(map(([collections, query]) => modifyDetailPerspectiveQuery(query, collections)));
      default:
        return this.store$.pipe(select(selectViewDataQuery));
    }
  }

  public switchPerspective(perspective: Perspective, cursor?: ViewCursor, queryToSet?: string): void {
    if (cursor) {
      const cursorString = convertViewCursorToString(cursor);

      this.navigateToPerspective(perspective, cursorString, queryToSet);
    } else {
      this.navigateToPerspective(perspective, null, queryToSet);
    }
  }

  private navigateToPerspective(perspective: Perspective, cursor: string, queryToSet?: string) {
    this.store$.pipe(select(selectWorkspace), take(1)).subscribe(workspace => {
      const viewPath: any[] = ['w', workspace.organizationCode, workspace.projectCode, 'view'];
      viewPath.push(perspective.toString());

      if (queryToSet || cursor) {
        this.router.navigate(viewPath, {
          queryParams: {
            [QueryParam.Query]: queryToSet,
            [QueryParam.ViewCursor]: cursor,
          },
        });
      } else {
        this.router.navigate(viewPath, {queryParamsHandling: 'preserve'});
      }
    });
  }
}
