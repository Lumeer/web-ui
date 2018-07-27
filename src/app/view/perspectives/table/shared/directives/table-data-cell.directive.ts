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

import {Directive, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {Actions} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs/index';
import {AppState} from '../../../../../core/store/app.state';
import {AttributeModel} from '../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../core/store/collections/collections.action';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {LinkInstanceModel} from '../../../../../core/store/link-instances/link-instance.model';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {findTableColumnWithCursor, TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TableModel, TableSingleColumn} from '../../../../../core/store/tables/table.model';
import {findTableRow} from '../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';

@Directive({
  selector: '[tableDataCell]',
  host: {
    '[class.uninitialized-column]': '!column?.attributeId'
  }
})
export class TableDataCellDirective implements OnChanges, OnDestroy {

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

  @Input()
  public value: string;

  @Output()
  public edit = new EventEmitter<string>();

  private editSubscription: Subscription;

  private savingDisabled: boolean;

  public constructor(private actions$: Actions,
                     private store: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected) {
      this.bindOrUnbindEditSelectedCell();
    }
  }

  private bindOrUnbindEditSelectedCell() {
    if (this.selected) {
      this.editSubscription = this.actions$.ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL)
        .subscribe(action => {
          this.edit.emit(action.payload.letter);
        });
    } else {
      if (this.editSubscription) {
        this.editSubscription.unsubscribe();
      }
    }
  }

  public ngOnDestroy() {
    if (this.editSubscription) {
      this.editSubscription.unsubscribe();
    }
  }

  @HostListener('editStart')
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

  @HostListener('editEnd', ['$event'])
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

  public disableSaving() {
    this.savingDisabled = true;
  }

  private saveData(value: string) {
    if (this.savingDisabled || this.value === value) {
      return;
    }

    this.updateData(value);
  }

  public updateData(value: string) {
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
      const attribute = attributes.find(attr => attr.name === attributeName);
      if (attribute) {
        this.store.dispatch(new TablesAction.InitColumn({cursor, attributeId: attribute.id}));
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
        callback: () => this.expandLinkedRow()
      }));
    };
  }

  private expandLinkedRow() {
    const cursor = {...this.cursor, rowPath: this.cursor.rowPath.slice(0, -1)};
    this.store.dispatch(new TablesAction.ExpandRows({cursor}));
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

}
