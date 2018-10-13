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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {ContextMenuComponent} from 'ngx-contextmenu';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../../../core/store/documents/documents.action';
import {LinkInstanceModel} from '../../../../../../../../core/store/link-instances/link-instance.model';
import {LinkInstancesAction} from '../../../../../../../../core/store/link-instances/link-instances.action';
import {TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TableModel} from '../../../../../../../../core/store/tables/table.model';
import {createEmptyTableRow, findTableRow, splitRowPath} from '../../../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {Direction} from '../../../../../../../../shared/direction';

@Component({
  selector: 'table-data-cell-menu',
  templateUrl: './table-data-cell-menu.component.html',
  styleUrls: ['./table-data-cell-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDataCellMenuComponent implements OnChanges {

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public table: TableModel; // TODO remove

  @Output()
  public edit = new EventEmitter();

  @ViewChild(ContextMenuComponent)
  public contextMenu: ContextMenuComponent;

  public created: boolean;

  public constructor(private store$: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document && this.document) {
      this.created = !!this.document.id;
    }
    if (changes.linkInstance && this.linkInstance) {
      this.created = !!this.linkInstance.id;
    }
  }

  public onAddRow(indexDelta: number) {
    const {parentPath, rowIndex} = splitRowPath(this.cursor.rowPath);
    const rowPath = parentPath.concat(rowIndex + indexDelta);
    const cursor = {...this.cursor, rowPath};

    const emptyRow = createEmptyTableRow();

    if (this.cursor.partIndex === 0) {
      this.store$.dispatch(new TablesAction.AddPrimaryRows({cursor, rows: [emptyRow]}));
    } else {
      this.store$.dispatch(new TablesAction.AddLinkedRows({cursor, linkedRows: [emptyRow]}));
    }

    if (indexDelta > 0) {
      this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
    }
  }

  public onRemoveRow() {
    // TODO delete link instance
    // TODO response from server might be slow and some change can be done to the table in the meantime
    const removeRowAction = new TablesAction.RemoveRow({cursor: this.cursor});
    if (this.document && this.document.id) {
      this.store$.dispatch(new DocumentsAction.DeleteConfirm({
        collectionId: this.document.collectionId,
        documentId: this.document.id,
        nextAction: removeRowAction
      }));
      return;
    }
    if (this.linkInstance && this.linkInstance.id) {
      // TODO
    }
    this.store$.dispatch(removeRowAction);
  }

  public onUnlinkRow() {
    const linkInstanceId = findTableRow(this.table.config.rows, this.cursor.rowPath).linkInstanceId;
    const callback = () => this.store$.dispatch(new TablesAction.RemoveRow({cursor: this.cursor}));
    this.store$.dispatch(new LinkInstancesAction.Delete({linkInstanceId, callback}));
  }

}
