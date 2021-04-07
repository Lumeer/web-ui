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

import {Injectable, OnDestroy} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../store/app.state';
import {FileAttachmentsAction} from '../store/file-attachments/file-attachments.action';
import {selectViewQuery} from '../store/views/views.state';
import {filter, switchMap} from 'rxjs/operators';
import {queryIsNotEmpty} from '../store/navigation/query/query.util';
import {selectPerspective} from '../store/navigation/navigation.state';
import {Perspective} from '../../view/perspectives/perspective';
import {selectTasksQuery} from '../store/common/permissions.selectors';

@Injectable()
export class FileAttachmentsService implements OnDestroy {
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public init() {
    this.subscriptions.add(this.subscribeToQuery());
  }

  private subscribeToQuery(): Subscription {
    return this.store$
      .pipe(
        select(selectPerspective),
        switchMap(perspective => {
          if (perspective === Perspective.Search) {
            return this.store$.pipe(select(selectTasksQuery));
          }
          return this.store$.pipe(
            select(selectViewQuery),
            filter(query => queryIsNotEmpty(query))
          );
        })
      )
      .subscribe(query => this.store$.dispatch(new FileAttachmentsAction.GetByQuery({query})));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
