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

import {Component, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../core/store/app.state';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {selectDocumentsByQuery} from '../../../../../core/store/documents/documents.state';
import {QueryModel} from '../../../../../core/store/navigation/query.model';
import {TableBodyCursor, TableCursor} from '../../../../../core/store/tables/table-cursor';
import {EMPTY_TABLE_ROW, TableModel, TableRow} from '../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../core/store/tables/tables.state';

@Component({
  selector: 'table-rows',
  templateUrl: './table-rows.component.html'
})
export class TableRowsComponent implements OnChanges, OnDestroy {

  @Input()
  public firstRowNumber = 1;

  @Input()
  public table: TableModel;

  @Input()
  public query: QueryModel;

  private selectedCursor: TableCursor;

  private subscriptions = new Subscription();

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) {
      this.resetSubscriptions();
      this.retrieveDocuments();
      this.bindDocuments();
      this.bindSelectedCursor();
    }
  }

  private resetSubscriptions() {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  private retrieveDocuments(page: number = 0) {
    const query: QueryModel = {...this.query, page, pageSize: 50};
    this.store.dispatch(new DocumentsAction.Get({query}));
  }

  private bindDocuments() {
    this.subscriptions.add(
      this.store.select(selectDocumentsByQuery).subscribe(documents => {
        const cursor: TableBodyCursor = {
          tableId: this.table.id,
          rowPath: [this.table.rows.length],
          partIndex: 0
        };

        const rows: TableRow[] = documents.filter(document => !this.table.documentIds.has(document.id))
          .map(document => ({...EMPTY_TABLE_ROW, documentIds: [document.id]}));
        if (rows.length) {
          this.store.dispatch(new TablesAction.AddRows({cursor, rows}));
        }
      })
    );
  }

  private bindSelectedCursor() {
    this.subscriptions.add(
      this.store.select(selectTableCursor)
        .subscribe(cursor => this.selectedCursor = cursor)
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public createCursor(rowIndex: number): TableBodyCursor {
    return {
      tableId: this.table.id,
      rowPath: [rowIndex],
      partIndex: 0,
      columnIndex: undefined
    };
  }

  public onScroll() {
    // TODO change query in order to load more documents
    console.log('scrolling');
  }

  public trackByDocumentId(index: number, row: TableRow): string {
    return row.documentIds[0];
  }

}
