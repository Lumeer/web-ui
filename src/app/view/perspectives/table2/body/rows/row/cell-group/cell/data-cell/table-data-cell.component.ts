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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {Actions} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../../../../core/store/app.state';
import {AttributeModel} from '../../../../../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../../../../../core/store/collections/collections.action';
import {DocumentModel} from '../../../../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../../../../core/store/documents/documents.action';
import {LinkInstanceModel} from '../../../../../../../../../core/store/link-instances/link-instance.model';
import {LinkInstancesAction} from '../../../../../../../../../core/store/link-instances/link-instances.action';
import {findTableColumnWithCursor, TableBodyCursor} from '../../../../../../../../../core/store/tables/table-cursor';
import {EMPTY_TABLE_ROW, TableCompoundColumn, TableModel, TableRow, TableSingleColumn} from '../../../../../../../../../core/store/tables/table.model';
import {findTableRow, splitRowPath} from '../../../../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../../../../core/store/tables/tables.action';
import {selectAffected} from '../../../../../../../../../core/store/tables/tables.state';
import {TableColumnContextMenuComponent} from '../../../../../../header/column-group/single-column/context-menu/table-column-context-menu.component';
import {TableEditableCellComponent} from '../../../../../../shared/editable-cell/table-editable-cell.component';

@Component({
  selector: 'table-data-cell',
  templateUrl: './table-data-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableDataCellComponent implements OnChanges {

  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public column: TableSingleColumn;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public selected: boolean;

  @Input()
  public table: TableModel;

  @ViewChild(TableEditableCellComponent)
  public editableCellComponent: TableEditableCellComponent;

  @ViewChild(TableColumnContextMenuComponent)
  public contextMenuComponent: TableColumnContextMenuComponent;

  public affected$: Observable<boolean>;

  private editSubscription: Subscription;

  private linkCreated: boolean;
  private editedValue: string;

  public value: string;

  public constructor(private actions$: Actions,
                     private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document || changes.linkInstance || changes.column) {
      this.value = this.extractValue();
      if (this.cursor && this.cursor.partIndex > 0) {
        this.affected$ = this.store.select(selectAffected({
          documentId: this.document.id,
          attributeId: this.column.attributeId
        }));
      }
    }
    if (changes.selected) {
      this.bindOrUnbindEditSelectedCell();
    }
  }

  private bindOrUnbindEditSelectedCell() {
    if (this.selected) {
      this.editSubscription = this.actions$.ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL)
        .subscribe(action => {
          this.editableCellComponent.startEditing(action.payload.letter);
        });
    } else {
      if (this.editSubscription) {
        this.editSubscription.unsubscribe();
      }
    }
  }

  public extractValue(): string {
    const attributeId = this.column.attributeId;
    if (this.document && this.document.data) {
      return this.document.data[attributeId];
    }
    if (this.linkInstance && this.linkInstance.data) {
      return this.linkInstance.data[attributeId];
    }
  }

  public onValueChange(value: string) {
    this.editedValue = value;
  }

  public onEditStart() {
    if (this.document.id) {
      this.store.dispatch(new TablesAction.SetEditedAttribute({
        editedAttribute: {
          documentId: this.document.id,
          attributeId: this.column.attributeId
        }
      }));
    }
  }

  public onEditEnd(value: string) {
    this.clearEditedAttribute();
    if (value) {
      this.saveData(value);
    }
  }

  private clearEditedAttribute() {
    if (this.document.id) {
      this.store.dispatch(new TablesAction.SetEditedAttribute({editedAttribute: null}));
    }
  }

  private saveData(value: string) {
    if (this.linkCreated || this.value === value) {
      return;
    }

    if (this.document) {
      this.updateDocumentData(this.column.attributeId, this.column.attributeName, value);
    }
    if (this.linkInstance) {
      this.updateLinkInstanceData(this.column.attributeId, this.column.attributeName, value);
    }
  }

  private updateDocumentData(attributeId: string, attributeName: string, value: string) {
    if (this.document.id) {
      this.updateDocument(attributeId, attributeName, value);
    } else {
      this.createDocument(attributeId, attributeName, value);
    }
  }

  private createDocument(attributeId: string, attributeName: string, value: string) {
    if (!attributeId) {
      const document: DocumentModel = {...this.document, newData: {[attributeName]: {value}}};
      const createDocumentAction = new DocumentsAction.Create({document, callback: this.createLinkInstanceCallback()});
      const newAttribute = {name: attributeName, constraints: []};

      this.store.dispatch(new CollectionsAction.CreateAttributes({
        collectionId: this.document.collectionId,
        attributes: [newAttribute],
        nextAction: createDocumentAction,
        callback: this.replaceTableColumnCallback(attributeName)
      }));
    } else {
      const data = {[attributeId]: value};
      const document: DocumentModel = {...this.document, data: data};

      this.store.dispatch(new DocumentsAction.Create({document, callback: this.createLinkInstanceCallback()}));
    }
  }

  private replaceTableColumnCallback(attributeName: string): (attributes: AttributeModel[]) => void {
    const {column, cursor} = findTableColumnWithCursor(this.table, this.cursor.partIndex, attributeName);

    return attributes => {
      const attribute = attributes.find(attribute => attribute.name === attributeName);
      if (attribute) {
        const parent: TableSingleColumn = new TableSingleColumn(attribute.id, null, column.parent.width);
        const columns = [new TableCompoundColumn(parent, [])];
        this.store.dispatch(new TablesAction.ReplaceColumns({cursor, deleteCount: 1, columns}));
      }
    };
  }

  private createLinkInstanceCallback(): (documentId: string) => void {
    if (this.cursor.partIndex === 0) {
      return null;
    }

    // TODO what if table is embedded?

    const {linkTypeId} = this.table.parts[this.cursor.partIndex - 1];
    const previousRow = findTableRow(this.table.rows, this.cursor.rowPath.slice(0, -1));

    return documentId => {
      const linkInstance: LinkInstanceModel = {
        linkTypeId,
        documentIds: [previousRow.documentIds[0], documentId]
      };
      this.store.dispatch(new LinkInstancesAction.Create({
        linkInstance,
        callback: this.replaceTableRowsCallback(documentId)
      }));
    };
  }

  private replaceTableRowsCallback(documentId: string): (linkInstanceId: string) => void {
    return linkInstanceId => {
      const linkedRows: TableRow[] = [{documentIds: [documentId], linkInstanceIds: [linkInstanceId]}];
      const cursor: TableBodyCursor = {...this.cursor, rowPath: this.cursor.rowPath.slice(0, -1)};
      this.store.dispatch(new TablesAction.AddLinkedRows({cursor, linkedRows}));
    };
  }

  private updateDocument(attributeId: string, attributeName: string, value: string) {
    if (!attributeId) {
      const document = {collectionId: this.document.collectionId, id: this.document.id, data: {}, newData: {[attributeName]: {value}}};
      const patchDocumentAction = new DocumentsAction.PatchData({document});
      const newAttribute = {name: attributeName, constraints: []};

      this.store.dispatch(new CollectionsAction.CreateAttributes({
        collectionId: this.document.collectionId,
        attributes: [newAttribute],
        nextAction: patchDocumentAction,
        callback: this.replaceTableColumnCallback(attributeName)
      }));
    } else {
      const document = {collectionId: this.document.collectionId, id: this.document.id, data: {[attributeId]: value}};
      this.store.dispatch(new DocumentsAction.PatchData({document}));
    }
  }

  private updateLinkInstanceData(key: string, name: string, value: string) {
    // TODO dispatch patch link instance action
  }

  public onEdit() {
    this.editableCellComponent.startEditing();
  }

  public onAddRow(indexDelta: number) {
    const {parentPath, rowIndex} = splitRowPath(this.cursor.rowPath);
    const rowPath = parentPath.concat(rowIndex + indexDelta);
    const cursor = {...this.cursor, rowPath};

    this.store.dispatch(new TablesAction.ReplaceRows({cursor, rows: [EMPTY_TABLE_ROW], deleteCount: 0}));
  }

  public onRemoveRow() {
    // TODO delete link instance
    // TODO response from server might be slow and some change can be done to the table in the meantime
    const removeRowAction = new TablesAction.RemoveRow({cursor: this.cursor});
    if (this.document && this.document.id) {
      this.store.dispatch(new DocumentsAction.DeleteConfirm({
        collectionId: this.document.collectionId,
        documentId: this.document.id,
        nextAction: removeRowAction
      }));
      return;
    }
    if (this.linkInstance && this.linkInstance.id) {
      // TODO
    }
    this.store.dispatch(removeRowAction);
  }

  public onUnlinkRow() {
    const linkInstanceId = findTableRow(this.table.rows, this.cursor.rowPath).linkInstanceIds[0];
    // TODO what is 'this' if the component is destroyed in the meantime?
    const callback = () => this.store.dispatch(new TablesAction.RemoveRow({cursor: this.cursor}));
    this.store.dispatch(new LinkInstancesAction.DeleteConfirm({linkInstanceId, callback}));
  }

  public onCreateLink(document: DocumentModel) {
    this.linkCreated = true;

    const {parentPath} = splitRowPath(this.cursor.rowPath);
    const part = this.table.parts[this.cursor.partIndex - 1];
    const previousRow = findTableRow(this.table.rows, parentPath);

    const linkInstance: LinkInstanceModel = {
      linkTypeId: part.linkTypeId,
      documentIds: [previousRow.documentIds[0], document.id]
    };
    this.store.dispatch(new LinkInstancesAction.Create({linkInstance}));
  }

}
