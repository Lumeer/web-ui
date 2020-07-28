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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {Query} from '../../../core/store/navigation/query/query';
import {selectQuery} from '../../../core/store/navigation/navigation.state';

@Component({
  selector: 'workflow-perspective',
  templateUrl: './workflow-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowPerspectiveComponent implements OnInit {

  public collections$: Observable<Collection[]>;
  public documents$: Observable<DocumentModel[]>;
  public query$: Observable<Query>;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.query$ = this.store$.pipe(select(selectQuery));
  }

}
