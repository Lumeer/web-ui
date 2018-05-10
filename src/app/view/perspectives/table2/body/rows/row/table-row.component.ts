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
import {SimpleChange} from '@angular/core/src/change_detection/change_detection_util';
import {Store} from '@ngrx/store';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../core/store/documents/document.model';
import {getOtherLinkedDocumentId, LinkInstanceModel} from '../../../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByTypeAndDocuments} from '../../../../../../core/store/link-instances/link-instances.state';
import {TableBodyCursor} from '../../../../../../core/store/tables/table-cursor';
import {EMPTY_TABLE_ROW, TableModel, TableRow} from '../../../../../../core/store/tables/table.model';
import {isTableRowStriped} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';

@Component({
  selector: 'table-row',
  templateUrl: './table-row.component.html'
})
export class TableRowComponent implements OnChanges, OnDestroy {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public row: TableRow;

  public striped: boolean;

  private linkInstancesSubscription: Subscription;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['table']) {
      this.onTableChange(changes['table'], changes['row']);
    }
    if (changes['cursor']) {
      this.striped = isTableRowStriped(this.cursor.rowPath);
    }
  }

  private onTableChange(tableChange: SimpleChange, rowChange: SimpleChange) {
    if (this.row && this.row.documentIds && this.isNextPartAdded(tableChange.previousValue, tableChange.currentValue)) {
      const {linkTypeId} = this.table.parts[this.cursor.partIndex + 1];
      this.linkInstancesSubscription = this.subscribeToLinkInstances(linkTypeId, this.row.documentIds);
      return;
    }

    if (this.isNextPartRemoved(tableChange.previousValue, tableChange.currentValue)) {
      if (this.linkInstancesSubscription) {
        this.linkInstancesSubscription.unsubscribe();
      }
      return;
    }

    if (rowChange && this.areLinkedRowsCollapsedOrExpanded(rowChange.previousValue, rowChange.currentValue)) {
      if (this.linkInstancesSubscription) {
        this.linkInstancesSubscription.unsubscribe();
      }
      const {linkTypeId} = this.table.parts[this.cursor.partIndex + 1];
      this.linkInstancesSubscription = this.subscribeToLinkInstances(linkTypeId, this.row.documentIds);
    }
  }

  private subscribeToLinkInstances(linkTypeId: string, documentIds: string[]): Subscription {
    return this.store
      .select(selectLinkInstancesByTypeAndDocuments(linkTypeId, documentIds))
      .pipe(filter(linkInstances => linkInstances.length > 0))
      .subscribe(linkInstances => {
        this.store.dispatch(new TablesAction.AddLinkedRows({
          cursor: this.cursor,
          linkedRows: this.createLinkedRows(linkInstances)
        }));
      });
  }

  private createLinkedRows(linkInstances: LinkInstanceModel[]): TableRow[] {
    const expanded = this.table.expanded || this.row.expanded;

    if (!expanded) {
      const linkInstanceIds = linkInstances.map(linkInstance => linkInstance.id);
      const documentIds = linkInstances.map(linkInstance => getOtherLinkedDocumentId(linkInstance, this.row.documentIds[0]));
      return [{linkInstanceIds, documentIds, linkedRows: []}];
    }

    return linkInstances.map(linkInstance => {
      const documentId = getOtherLinkedDocumentId(linkInstance, this.row.documentIds[0]);
      return {
        linkInstanceIds: [linkInstance.id],
        documentIds: [documentId],
        linkedRows: []
      };
    });
  }

  private isNextPartRemoved(oldTable: TableModel, newTable: TableModel): boolean {
    return oldTable && newTable
      && oldTable.parts.length > this.cursor.partIndex + 1
      && newTable.parts.length === this.cursor.partIndex + 1;
  }

  private isNextPartAdded(oldTable: TableModel, newTable: TableModel): boolean {
    return newTable && newTable.parts.length > this.cursor.partIndex + 1
      && (!oldTable || oldTable.parts.length === this.cursor.partIndex + 1);
  }

  private areLinkedRowsCollapsedOrExpanded(oldRow: TableRow, newRow: TableRow): boolean {
    return oldRow && newRow && oldRow.expanded != newRow.expanded;
  }

  public ngOnDestroy() {
    if (this.linkInstancesSubscription) {
      this.linkInstancesSubscription.unsubscribe();
    }
  }

  public createNextPartCursor(rowIndex: number): TableBodyCursor {
    return {
      ...this.cursor,
      partIndex: this.collectionPartCursor().partIndex + 1,
      rowPath: [...this.cursor.rowPath, rowIndex]
    };
  }

  public createEmptyLinkedRow(): TableRow {
    return EMPTY_TABLE_ROW;
  }

  public collectionPartCursor(): TableBodyCursor {
    const offset = this.isFirstPart() ? 0 : 1;
    return {...this.cursor, partIndex: this.cursor.partIndex + offset};
  }

  public isFirstPart(): boolean {
    return this.cursor.partIndex === 0;
  }

  public isLastPart(): boolean {
    return this.cursor.partIndex + 2 > this.table.parts.length - 1;
  }

  public trackByLinkInstanceId(index: number, linkedRow: TableRow): string | object {
    return linkedRow.linkInstanceIds && linkedRow.linkInstanceIds[0];
  }

  public newDocument(): DocumentModel {
    const part = this.table.parts[this.cursor.partIndex + 2];

    return {
      collectionId: part.collectionId,
      data: {}
    };
  }

}
