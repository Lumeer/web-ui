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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Collection} from '../../../../../../core/store/collections/collection';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {AppState} from '../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectAllDocuments} from '../../../../../../core/store/documents/documents.state';

@Component({
  selector: 'empty-tasks',
  templateUrl: './empty-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyTasksComponent implements OnInit {
  @Input()
  public query: Query;

  @Input()
  public collections: Collection[];

  @Output()
  public tablePerspective = new EventEmitter();

  public allDocuments$: Observable<DocumentModel[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.allDocuments$ = this.store$.pipe(select(selectAllDocuments));
  }

  public onSwitchToTablePerspective() {
    this.tablePerspective.emit();
  }
}
