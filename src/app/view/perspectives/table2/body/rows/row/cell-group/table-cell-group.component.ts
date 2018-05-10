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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {selectDocumentsByIds} from '../../../../../../../core/store/documents/documents.state';
import {LinkInstanceModel} from '../../../../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByIds} from '../../../../../../../core/store/link-instances/link-instances.state';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableColumn, TableModel, TableRow} from '../../../../../../../core/store/tables/table.model';
import {selectTablePartLeafColumns} from '../../../../../../../core/store/tables/tables.state';

@Component({
  selector: 'table-cell-group',
  templateUrl: './table-cell-group.component.html',
  styleUrls: ['./table-cell-group.component.scss']
})
export class TableCellGroupComponent implements OnInit, OnDestroy {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableRow;

  public documents: DocumentModel[];
  public linkInstances: LinkInstanceModel[];

  private subscriptions = new Subscription();

  public columns$: Observable<TableColumn[]>;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.bindColumns();
    this.bindData();
  }

  private bindColumns() {
    this.columns$ = this.store.select(selectTablePartLeafColumns(this.cursor.tableId, this.cursor.partIndex));
  }

  private bindData() {
    const part = this.table.parts[this.cursor.partIndex];

    if (part.collectionId) {
      this.bindDocument(part.collectionId);
    }
    if (part.linkTypeId) {
      this.bindLinkInstance(part.linkTypeId);
    }
  }

  private bindDocument(collectionId: string) {
    this.subscriptions.add(
      this.store.select(selectDocumentsByIds(this.row.documentIds))
        .subscribe(documents => this.documents = documents && documents.length ? documents : [{collectionId, data: {}}])
    );
  }

  private bindLinkInstance(linkTypeId: string) {
    this.subscriptions.add(
      this.store.select(selectLinkInstancesByIds(this.row.linkInstanceIds))
        .subscribe(linkInstances => this.linkInstances = linkInstances) // TODO what if it does not exist?
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public createColumnCursor(columnIndex: number): TableBodyCursor {
    return {...this.cursor, columnIndex};
  }

}
