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

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Actions} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {ContextMenuService} from 'ngx-contextmenu';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, first} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../../../core/store/app.state';
import {AttributeModel} from '../../../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../../../core/store/collections/collections.action';
import {DocumentMetaData, DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../../core/store/documents/documents.action';
import {LinkInstanceModel} from '../../../../../../../core/store/link-instances/link-instance.model';
import {LinkInstancesAction} from '../../../../../../../core/store/link-instances/link-instances.action';
import {findTableColumnWithCursor, TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigRow, TableModel, TableSingleColumn} from '../../../../../../../core/store/tables/table.model';
import {findTableRow} from '../../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../../core/store/tables/tables.action';
import {selectTableRow} from '../../../../../../../core/store/tables/tables.selector';
import {selectAffected, selectTableById} from '../../../../../../../core/store/tables/tables.state';
import {Direction} from '../../../../../../../shared/direction';
import {DocumentHintsComponent} from '../../../../../../../shared/document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../../../../../shared/key-code';
import {TableEditableCellDirective} from '../../../../shared/directives/table-editable-cell.directive';
import {EDITABLE_EVENT} from '../../../../table-perspective.component';
import {TableDataCellMenuComponent} from './menu/table-data-cell-menu.component';

@Component({
  selector: 'table-data-cell',
  templateUrl: './table-data-cell.component.html',
  styleUrls: ['./table-data-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDataCellComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public column: TableSingleColumn;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstanceModel;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public selected: boolean;

  @Input()
  public table: TableModel;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @ViewChild(TableDataCellMenuComponent)
  public menuComponent: TableDataCellMenuComponent;

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  @ViewChild(TableEditableCellDirective)
  public editableCell: TableEditableCellDirective;

  public affected$: Observable<boolean>;
  public suggesting$ = new BehaviorSubject(false);

  public editedValue: string;

  private selectedSubscriptions = new Subscription();

  private savingDisabled: boolean;

  public constructor(
    private actions$: Actions,
    private contextMenuService: ContextMenuService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.bindAffected();
  }

  private bindAffected() {
    if (this.cursor.partIndex < 2) {
      return;
    }

    this.affected$ = this.store$
      .select(
        selectAffected({
          attributeId: this.column.attributeId,
          documentId: this.document && this.document.id,
          linkInstanceId: this.linkInstance && this.linkInstance.id,
        })
      )
      .pipe(distinctUntilChanged());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selected) {
      this.selectedSubscriptions.unsubscribe();
      if (this.selected) {
        this.selectedSubscriptions = new Subscription();
        this.selectedSubscriptions.add(this.subscribeToEditSelectedCell());
        this.selectedSubscriptions.add(this.subscribeToRemoveSelectedCell());
      }
    }
    if (changes.document || changes.linkInstace) {
      this.checkSuggesting();
    }
  }

  private checkSuggesting() {
    if (this.cursor.partIndex < 2) {
      return;
    }

    this.suggesting$.next(!this.isEntityInitialized() || !this.editedValue);
  }

  private subscribeToEditSelectedCell(): Subscription {
    return this.actions$
      .ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL)
      .subscribe(action => this.editableCell.startEditing(action.payload.clear));
  }

  private subscribeToRemoveSelectedCell(): Subscription {
    return this.actions$
      .ofType<TablesAction.RemoveSelectedCell>(TablesActionType.REMOVE_SELECTED_CELL)
      .subscribe(() => this.deleteCellData());
  }

  private deleteCellData() {
    if (this.isEntityInitialized() && !!this.getValue()) {
      this.updateData(null);
    }
  }

  private getValue(): any {
    if (this.document && this.document.data) {
      return this.document.data[this.column.attributeId];
    }
    if (this.linkInstance && this.linkInstance.data) {
      return this.linkInstance.data[this.column.attributeId];
    }
    return '';
  }

  private isEntityInitialized(): boolean {
    return !!(this.document && this.document.id) || !!(this.linkInstance && this.linkInstance.id);
  }

  public ngOnDestroy() {
    this.selectedSubscriptions.unsubscribe();
  }

  public onEditStart() {
    if (this.document.id) {
      this.store$.dispatch(
        new TablesAction.SetEditedAttribute({
          editedAttribute: {
            documentId: this.document.id,
            attributeId: this.column.attributeId,
          },
        })
      );
    }
  }

  public onEditEnd(value: string) {
    this.clearEditedAttribute();

    if (!isNullOrUndefined(value)) {
      // TODO maybe null values in the future
      this.useSelectionOrSave(value);
    }

    this.checkSuggesting();
  }

  private useSelectionOrSave(value: string) {
    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(value);
    }
  }

  private clearEditedAttribute() {
    if (this.document.id) {
      this.store$.dispatch(new TablesAction.SetEditedAttribute({editedAttribute: null}));
    }
  }

  public disableSaving() {
    this.savingDisabled = true;
  }

  private saveData(value: string) {
    if (this.savingDisabled || this.getValue() === value || (!value && !this.isEntityInitialized())) {
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
    combineLatest(
      this.store$.pipe(select(selectTableById(this.cursor.tableId))),
      this.store$.pipe(select(selectTableRow(this.cursor)))
    )
      .pipe(first())
      .subscribe(([table, row]) => {
        if (!attributeId) {
          this.createDocumentWithNewAttribute(table, row, attributeName, value);
        } else {
          this.createDocumentWithExistingAttribute(table, row, attributeId, value);
        }
      });
  }

  private createDocumentWithNewAttribute(table: TableModel, row: TableConfigRow, attributeName: string, value: string) {
    const document: DocumentModel = {
      ...this.document,
      correlationId: row && row.correlationId,
      newData: {[attributeName]: {value}},
      metaData: this.createDocumentMetaData(row),
    };
    const createDocumentAction = new DocumentsAction.Create({
      document,
      callback: this.createLinkInstanceCallback(table),
    });
    const newAttribute = {name: attributeName, constraints: []};

    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.document.collectionId,
        attributes: [newAttribute],
        nextAction: createDocumentAction,
        callback: this.replaceTableColumnCallback(table, attributeName),
      })
    );
  }

  private createDocumentWithExistingAttribute(
    table: TableModel,
    row: TableConfigRow,
    attributeId: string,
    value: string
  ) {
    const data = {[attributeId]: value};
    const document: DocumentModel = {
      ...this.document,
      correlationId: row && row.correlationId,
      data: data,
      metaData: this.createDocumentMetaData(row),
    };

    this.store$.dispatch(new DocumentsAction.Create({document, callback: this.createLinkInstanceCallback(table)}));
  }

  private createDocumentMetaData(row: TableConfigRow): DocumentMetaData {
    return this.cursor.partIndex === 0 ? {parentId: row.parentDocumentId} : undefined;
  }

  private replaceTableColumnCallback(table: TableModel, attributeName: string): (attributes: AttributeModel[]) => void {
    const {cursor} = findTableColumnWithCursor(table, this.cursor.partIndex, attributeName);

    return attributes => {
      const attribute = attributes.find(attr => attr.name === attributeName);
      if (attribute) {
        this.store$.dispatch(new TablesAction.InitColumn({cursor, attributeId: attribute.id}));
      }
    };
  }

  private createLinkInstanceCallback(table: TableModel): (documentId: string) => void {
    if (this.cursor.partIndex === 0) {
      return null;
    }

    // TODO what if table is embedded?

    const {linkTypeId} = table.parts[this.cursor.partIndex - 1];
    const previousRow = findTableRow(table.config.rows, this.cursor.rowPath.slice(0, -1));

    return documentId => {
      const linkInstance: LinkInstanceModel = {
        linkTypeId,
        documentIds: [previousRow.documentId, documentId],
      };
      this.store$.dispatch(new LinkInstancesAction.Create({linkInstance}));
    };
  }

  private updateDocument(attributeId: string, attributeName: string, value: string) {
    if (!attributeId) {
      this.updateDocumentWithNewAttribute(attributeName, value);
    } else {
      this.updateDocumentWithExistingAttribute(attributeId, value);
    }
  }

  private updateDocumentWithNewAttribute(attributeName: string, value: string) {
    const document = {
      collectionId: this.document.collectionId,
      id: this.document.id,
      data: {},
      newData: {[attributeName]: {value}},
    };
    const patchDocumentAction = new DocumentsAction.PatchData({document});
    const newAttribute = {name: attributeName, constraints: []};

    this.store$
      .pipe(
        select(selectTableById(this.cursor.tableId)),
        first()
      )
      .subscribe(table => {
        this.store$.dispatch(
          new CollectionsAction.CreateAttributes({
            collectionId: this.document.collectionId,
            attributes: [newAttribute],
            nextAction: patchDocumentAction,
            callback: this.replaceTableColumnCallback(table, attributeName),
          })
        );
      });
  }

  private updateDocumentWithExistingAttribute(attributeId: string, value: string) {
    // TODO what if user does not have permissions to see all columns?
    if (
      this.cursor.partIndex > 0 &&
      !value &&
      !Object.entries(this.document.data)
        .filter(([k]) => k !== attributeId)
        .some(([, v]) => v)
    ) {
      this.deleteDocument();
    } else {
      const document = {collectionId: this.document.collectionId, id: this.document.id, data: {[attributeId]: value}};
      this.store$.dispatch(new DocumentsAction.PatchData({document}));
    }
  }

  private deleteDocument() {
    const removeRowAction = new TablesAction.RemoveRow({cursor: this.cursor});
    if (this.document && this.document.id) {
      this.store$.dispatch(
        new DocumentsAction.Delete({
          collectionId: this.document.collectionId,
          documentId: this.document.id,
          nextAction: removeRowAction,
        })
      );
      return;
    }
    this.store$.dispatch(removeRowAction);
  }

  private updateLinkInstanceData(key: string, name: string, value: string) {
    // TODO dispatch patch link instance action
  }

  public onEdit() {
    if (this.editableCell) {
      this.editableCell.startEditing();
    }
  }

  public onValueChange(value: string) {
    this.editedValue = value;

    if (!value && this.cursor.partIndex > 1) {
      this.suggesting$.next(true);
    }
  }

  public onLinkCreate() {
    this.disableSaving();

    if (this.isEntityInitialized()) {
      this.deleteLinkInstance();
    }
  }

  public createLinkCallback(linkInstanceId: string, documentId: string) {
    this.store$.dispatch(
      new TablesAction.ReplaceRows({
        cursor: this.cursor,
        deleteCount: 1,
        rows: [{documentId, linkInstanceId, linkedRows: []}],
      })
    );
  }

  private deleteLinkInstance() {
    this.store$
      .pipe(
        select(selectTableRow(this.cursor)),
        first()
      )
      .subscribe(row => {
        const callback = () => this.store$.dispatch(new TablesAction.RemoveRow({cursor: this.cursor}));
        this.store$.dispatch(new LinkInstancesAction.Delete({linkInstanceId: row.linkInstanceId, callback}));
      });
  }

  public onEditKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
        return this.suggestions && this.suggestions.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        return this.suggestions && this.suggestions.moveSelection(Direction.Up);
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
      case KeyCode.Tab:
        return this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Right}));
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    event[EDITABLE_EVENT] = this.allowedPermissions && this.allowedPermissions.writeWithView;
  }

  public onMouseDown(event: MouseEvent) {
    if (!this.selected) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  public onContextMenu(event: MouseEvent) {
    setTimeout(() => this.showContextMenu(event));
  }

  private showContextMenu(event: MouseEvent) {
    this.contextMenuService.show.next({
      anchorElement: null,
      contextMenu: this.menuComponent.contextMenu,
      event,
      item: null,
    });
  }
}
