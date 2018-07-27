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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {AppState} from '../../../../../core/store/app.state';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {selectCollectionById} from '../../../../../core/store/collections/collections.state';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TablePart} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-header-collection',
  templateUrl: './table-header-collection.component.html',
  styleUrls: ['./table-header-collection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableHeaderCollectionComponent implements OnChanges {

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public part: TablePart;

  @Input()
  public table: TableModel;

  public collection$: Observable<CollectionModel>;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.part && this.part) {
      this.collection$ = this.store.select(selectCollectionById(this.part.collectionId));
    }
  }

  public onCaptionClick() {
    this.store.dispatch(new TablesAction.SetCursor({cursor: null}));
  }

}
