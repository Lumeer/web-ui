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
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {filter, first} from 'rxjs/operators';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {selectDocumentsByIds} from '../../../../../../core/store/documents/documents.state';
import {LinkInstanceModel} from '../../../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByIds} from '../../../../../../core/store/link-instances/link-instances.state';
import {areTableRowCursorsEqual, TableBodyCursor, TableCursor} from '../../../../../../core/store/tables/table-cursor';
import {
  TableColumn,
  TableColumnType,
  TableCompoundColumn,
  TableConfigRow,
  TableHiddenColumn,
  TableModel,
  TablePart,
} from '../../../../../../core/store/tables/table.model';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';
import {selectTablePart} from '../../../../../../core/store/tables/tables.selector';
import {
  selectTableById,
  selectTableCursor,
  selectTablePartLeafColumns,
} from '../../../../../../core/store/tables/tables.state';

@Component({
  selector: 'table-cell-group',
  templateUrl: './table-cell-group.component.html',
  styleUrls: ['./table-cell-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellGroupComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public rows: TableConfigRow[];

  @Input()
  public canManageConfig: boolean;

  public documents$: Observable<DocumentModel[]>;
  public linkInstances$: Observable<LinkInstanceModel[]>;

  public columns$: Observable<TableColumn[]>;
  public part$: Observable<TablePart>;
  public selectedCursor$: Observable<TableCursor>;

  public table$: Observable<TableModel>;

  private rowSelected: boolean;

  public constructor(private store$: Store<{}>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && this.cursor) {
      this.bindColumns();
      this.bindSelectedCursor();
      this.bindData();
      this.bindPart();
      this.table$ = this.store$.pipe(select(selectTableById(this.cursor.tableId)));
    }
  }

  private bindColumns() {
    this.columns$ = this.store$.pipe(select(selectTablePartLeafColumns(this.cursor.tableId, this.cursor.partIndex)));
  }

  private bindSelectedCursor() {
    this.selectedCursor$ = this.store$.pipe(
      select(selectTableCursor),
      filter(selectedCursor => {
        const rowBeingSelected = areTableRowCursorsEqual(this.cursor, selectedCursor);
        if (!this.rowSelected && !rowBeingSelected) {
          return false;
        }

        this.rowSelected = rowBeingSelected;
        return true;
      })
    );
  }

  private bindData() {
    this.store$
      .pipe(
        select(selectTablePart(this.cursor)),
        filter(part => !!part),
        first()
      )
      .subscribe(part => {
        if (part.collectionId) {
          const documentIds = this.rows.map(row => row.documentId);
          this.bindDocuments(part.collectionId, documentIds);
        }
        if (part.linkTypeId) {
          const linkInstanceIds = this.rows.map(row => row.linkInstanceId);
          this.bindLinkInstances(part.linkTypeId, linkInstanceIds);
        }
      });
  }

  private bindPart() {
    this.part$ = this.store$.pipe(select(selectTablePart(this.cursor)));
  }

  private bindDocuments(collectionId: string, documentIds: string[]) {
    this.documents$ = this.store$.pipe(select(selectDocumentsByIds(documentIds)));
  }

  private bindLinkInstances(linkTypeId: string, linkInstanceIds: string[]) {
    // TODO what if it does not exist?
    this.linkInstances$ = this.store$.pipe(select(selectLinkInstancesByIds(linkInstanceIds)));
  }

  public trackByAttributeIds(index: number, column: TableColumn): string {
    if (column.type === TableColumnType.COMPOUND) {
      const {parent} = column as TableCompoundColumn;
      return parent.attributeId || parent.attributeName;
    }
    if (column.type === TableColumnType.HIDDEN) {
      return (column as TableHiddenColumn).attributeIds.join('-');
    }
  }

  public onMouseDown(event: MouseEvent, columnIndex: number) {
    const cursor: TableBodyCursor = {...this.cursor, columnIndex};
    this.store$.dispatch(new TablesAction.SetCursor({cursor}));
    event.stopPropagation();
  }
}
