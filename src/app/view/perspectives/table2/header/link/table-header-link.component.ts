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
import {Observable} from 'rxjs/Observable';
import {AppState} from '../../../../../core/store/app.state';
import {CollectionModel} from '../../../../../core/store/collections/collection.model';
import {selectCollectionsByLinkType} from '../../../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {TableHeaderCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TablePart} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-header-link',
  templateUrl: './table-header-link.component.html',
  styleUrls: ['./table-header-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableHeaderLinkComponent implements OnChanges {

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public table: TableModel;

  @Input()
  public part: TablePart;

  public collections$: Observable<CollectionModel[]>;
  public linkType$: Observable<LinkTypeModel>;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.part && this.part) {
      this.linkType$ = this.store.select(selectLinkTypeById(this.part.linkTypeId));
      this.collections$ = this.store.select(selectCollectionsByLinkType(this.part.linkTypeId));
    }
  }

  public onSwitchParts() {
    this.store.dispatch(new TablesAction.SwitchParts({cursor: this.cursor}));
  }

  public onRemovePart() {
    this.store.dispatch(new TablesAction.RemovePart({cursor: this.cursor}));
  }

}
