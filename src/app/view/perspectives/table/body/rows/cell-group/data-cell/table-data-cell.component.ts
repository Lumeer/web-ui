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
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ContextMenuService} from 'ngx-contextmenu';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, first, map, skip, withLatestFrom} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';
import {Constraint, ConstraintType} from '../../../../../../../core/model/data/constraint';
import {NotificationService} from '../../../../../../../core/notifications/notification.service';
import {AppState} from '../../../../../../../core/store/app.state';
import {CollectionsAction} from '../../../../../../../core/store/collections/collections.action';
import {selectCollectionAttributeConstraint} from '../../../../../../../core/store/collections/collections.state';
import {DocumentMetaData, DocumentModel} from '../../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../../../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../../../../../core/store/link-instances/link.instance';
import {LinkTypesAction} from '../../../../../../../core/store/link-types/link-types.action';
import {selectLinkTypeAttributeById} from '../../../../../../../core/store/link-types/link-types.state';
import {TableBodyCursor} from '../../../../../../../core/store/tables/table-cursor';
import {TableConfigColumn, TableConfigRow, TableModel} from '../../../../../../../core/store/tables/table.model';
import {findTableRow, getTableColumnWidth} from '../../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../../core/store/tables/tables.action';
import {selectAffected, selectTableById, selectTableRow} from '../../../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../../../shared/direction';
import {DocumentHintsComponent} from '../../../../../../../shared/document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../../../../../shared/key-code';
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
  public column: TableConfigColumn;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstance;

  @Input()
  public canManageConfig: boolean;

  @Input()
  @HostBinding('class.selected')
  public selected: boolean;

  @Input()
  public table: TableModel;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Output()
  public affect = new EventEmitter();

  @ViewChild(TableDataCellMenuComponent)
  public menuComponent: TableDataCellMenuComponent;

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  @HostBinding('class.affected')
  public affected: boolean;

  @HostBinding('class.edited')
  public edited: boolean;

  @HostBinding('style.width.px')
  public columnWidth: number;

  @HostBinding('class.table-border-right')
  public tableBorderRight = true;

  @HostBinding('class.table-border-bottom')
  public tableBorderBottom = true;

  public editing$ = new BehaviorSubject(false);
  public suggesting$ = new BehaviorSubject(false);

  public constraint$: Observable<Constraint>;

  public editedValue: any;
  public hiddenInputValue$ = new BehaviorSubject<any>('');

  private selectedSubscriptions = new Subscription();
  private subscriptions = new Subscription();

  private savingDisabled: boolean;

  public constructor(
    private actions$: Actions,
    private contextMenuService: ContextMenuService,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    if (this.cursor.partIndex > 1) {
      this.subscriptions.add(this.subscribeToAffected());
    }
    this.subscriptions.add(this.subscribeToEditing());
  }

  private subscribeToAffected(): Subscription {
    return this.store$
      .select(
        selectAffected({
          attributeId: this.column.attributeIds[0],
          documentId: this.document && this.document.id,
          linkInstanceId: this.linkInstance && this.linkInstance.id,
        })
      )
      .pipe(
        distinctUntilChanged(),
        withLatestFrom(this.editing$)
      )
      .subscribe(([affected, editing]) => {
        this.affected = affected && !editing;
        // TODO run change detection in parent component some other way
        this.affect.emit();
      });
  }

  private subscribeToEditing(): Subscription {
    return this.editing$
      .pipe(
        skip(1),
        distinctUntilChanged()
      )
      .subscribe(editing => {
        this.edited = editing;
        if (!editing) {
          this.clearEditedAttribute();
          this.editedValue = '';
          this.checkSuggesting();
          this.hiddenInputValue$.next('');

          if (this.selected) {
            // sets focus to hidden input
            this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
          }
        } else {
          this.setEditedAttribute();
        }
      });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.column || changes.document) && this.column && this.document) {
      this.constraint$ = this.store$.pipe(
        select(selectCollectionAttributeConstraint(this.document.collectionId, this.column.attributeIds[0]))
      );
    }
    if ((changes.column || changes.linkInstance) && this.column && this.linkInstance) {
      this.constraint$ = this.store$.pipe(
        select(selectLinkTypeAttributeById(this.linkInstance.linkTypeId, this.column.attributeIds[0])),
        map(attribute => attribute && attribute.constraint)
      );
    }
    if (changes.selected) {
      this.selectedSubscriptions.unsubscribe();
      if (this.selected) {
        this.selectedSubscriptions = new Subscription();
        this.selectedSubscriptions.add(this.subscribeToEditSelectedCell());
        this.selectedSubscriptions.add(this.subscribeToRemoveSelectedCell());
      } else {
        this.editing$.next(false);
      }
    }
    if (changes.document || changes.linkInstace) {
      this.checkSuggesting();
    }
    if ((changes.column || changes.canManageConfig) && this.column) {
      this.columnWidth = getTableColumnWidth(this.column, this.canManageConfig);
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
      .pipe(
        ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL),
        withLatestFrom(this.constraint$)
      )
      .subscribe(([action, constraint]) => {
        const {value} = action.payload;
        if (this.allowedPermissions && this.allowedPermissions.writeWithView) {
          if (constraint && constraint.type === ConstraintType.Boolean) {
            // switch checkbox only if Enter or Space is pressed
            if (!value || value === ' ') {
              const data = (this.document && this.document.data) || (this.linkInstance && this.linkInstance.data) || {};
              this.saveData(!data[this.column.attributeIds[0]]);
            }
          } else {
            this.editedValue = value;
            this.hiddenInputValue$.next(value);
            this.editing$.next(true);
          }
        }
      });
  }

  private subscribeToRemoveSelectedCell(): Subscription {
    return this.actions$
      .pipe(ofType<TablesAction.RemoveSelectedCell>(TablesActionType.REMOVE_SELECTED_CELL))
      .subscribe(() => this.deleteCellData());
  }

  private deleteCellData() {
    if (this.isEntityInitialized() && !!this.getValue()) {
      this.updateData(null);
    }
  }

  private getValue(): any {
    if (this.document && this.document.data) {
      return this.document.data[this.column.attributeIds[0]];
    }
    if (this.linkInstance && this.linkInstance.data) {
      return this.linkInstance.data[this.column.attributeIds[0]];
    }
    return '';
  }

  private isEntityInitialized(): boolean {
    return !!(this.document && this.document.id) || !!(this.linkInstance && this.linkInstance.id);
  }

  public ngOnDestroy() {
    this.selectedSubscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    if (!this.edited) {
      event.preventDefault();
    }
    if (!this.selected) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  @HostListener('dblclick', ['$event'])
  public onDoubleClick(event: MouseEvent) {
    if (!this.editing$.getValue()) {
      event.preventDefault();
      this.editing$.next(true); // TODO maybe set edited attribute?
    }
  }

  @HostListener('contextmenu', ['$event'])
  public onContextMenu(event: MouseEvent) {
    if (!this.edited) {
      setTimeout(() => this.showContextMenu(event));
    }
  }

  private showContextMenu(event: MouseEvent) {
    this.contextMenuService.show.next({
      anchorElement: null,
      contextMenu: this.menuComponent.contextMenu,
      event,
      item: null,
    });
  }

  private useSelectionOrSave(value: any) {
    if (!this.isPreviousLinkedRowInitialized()) {
      this.showUninitializedLinkedRowWarningAndResetValue();
      return;
    }

    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(value);
    }
  }

  private showUninitializedLinkedRowWarningAndResetValue() {
    this.notificationService.warning(
      this.i18n({
        id: 'table.data.cell.linked.row.uninitialized',
        value:
          'I cannot link the entered value to anything, you must enter a value to the previous part of the table first.',
      })
    );
    this.editedValue = '';
  }

  private isPreviousLinkedRowInitialized(): boolean {
    if (this.cursor.partIndex === 0) {
      return true;
    }

    const previousRow = findTableRow(this.table.config.rows, this.cursor.rowPath.slice(0, -1));
    return previousRow && !!previousRow.documentId;
  }

  private setEditedAttribute() {
    if (this.document && this.document.id) {
      this.store$.dispatch(
        new TablesAction.SetEditedAttribute({
          editedAttribute: {
            documentId: this.document.id,
            attributeId: this.column.attributeIds[0],
          },
        })
      );
    }
  }

  private clearEditedAttribute() {
    if (this.document && this.document.id) {
      this.store$.dispatch(new TablesAction.SetEditedAttribute({editedAttribute: null}));
    }
  }

  public disableSaving() {
    this.savingDisabled = true;
  }

  private saveData(value: any) {
    const previousValue = this.getValue() || this.getValue() === 0 ? this.getValue() : '';
    if (this.savingDisabled || previousValue === value || (!value && !this.isEntityInitialized())) {
      return;
    }

    this.updateData(value);
  }

  public updateData(value: any) {
    if (this.document) {
      this.updateDocumentData(this.column.attributeIds[0], this.column.attributeName, value);
    }
    if (this.linkInstance) {
      this.updateLinkInstanceData(this.column.attributeIds[0], this.column.attributeName, value);
    }
  }

  private updateDocumentData(attributeId: string, attributeName: string, value: any) {
    if (this.document.id) {
      this.updateDocument(attributeId, attributeName, value);
    } else {
      this.createDocument(attributeId, attributeName, value);
    }
  }

  private createDocument(attributeId: string, attributeName: string, value: any) {
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

  private createDocumentWithNewAttribute(table: TableModel, row: TableConfigRow, attributeName: string, value: any) {
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
    const newAttribute = {name: attributeName};

    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.document.collectionId,
        attributes: [newAttribute],
        nextAction: createDocumentAction,
      })
    );
  }

  private createDocumentWithExistingAttribute(table: TableModel, row: TableConfigRow, attributeId: string, value: any) {
    const document: DocumentModel = {
      ...this.document,
      correlationId: row && row.correlationId,
      data: {...this.document.data, [attributeId]: value},
      metaData: this.createDocumentMetaData(row),
    };

    this.store$.dispatch(new DocumentsAction.Create({document, callback: this.createLinkInstanceCallback(table)}));
  }

  private createDocumentMetaData(row: TableConfigRow): DocumentMetaData {
    return this.cursor.partIndex === 0 ? {parentId: row.parentDocumentId} : undefined;
  }

  private createLinkInstanceCallback(table: TableModel): (documentId: string) => void {
    if (this.cursor.partIndex === 0) {
      return null;
    }

    // TODO what if table is embedded?

    const {linkTypeId} = table.config.parts[this.cursor.partIndex - 1];
    const previousRow = findTableRow(table.config.rows, this.cursor.rowPath.slice(0, -1));

    return documentId => {
      const linkInstance: LinkInstance = {
        linkTypeId,
        documentIds: [previousRow.documentId, documentId],
      };
      this.store$.dispatch(new LinkInstancesAction.Create({linkInstance}));
    };
  }

  private updateDocument(attributeId: string, attributeName: string, value: any) {
    if (!attributeId) {
      this.updateDocumentWithNewAttribute(attributeName, value);
    } else {
      this.updateDocumentWithExistingAttribute(attributeId, value);
    }
  }

  private updateDocumentWithNewAttribute(attributeName: string, value: any) {
    const document = {
      collectionId: this.document.collectionId,
      id: this.document.id,
      data: {},
      newData: {[attributeName]: {value}},
    };
    const patchDocumentAction = new DocumentsAction.PatchData({document});
    const newAttribute = {name: attributeName};

    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.document.collectionId,
        attributes: [newAttribute],
        nextAction: patchDocumentAction,
      })
    );
  }

  private updateDocumentWithExistingAttribute(attributeId: string, value: any) {
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

  private updateLinkInstanceData(attributeId: string, attributeName: string, value: any) {
    if (attributeId) {
      this.updateLinkInstanceWithExistingAttribute(attributeId, value);
    } else {
      this.updateLinkInstanceWithNewAttribute(attributeName, value);
    }
  }

  private updateLinkInstanceWithNewAttribute(attributeName: string, value: any) {
    this.store$.dispatch(
      new LinkTypesAction.CreateAttributes({
        linkTypeId: this.linkInstance.linkTypeId,
        attributes: [{name: attributeName}],
        onSuccess: ([attribute]) => this.updateLinkInstanceWithExistingAttribute(attribute.id, value),
      })
    );
  }

  private updateLinkInstanceWithExistingAttribute(attributeId: string, value: any) {
    const linkInstance: LinkInstance = {
      id: this.linkInstance.id,
      documentIds: [null, null], // documentIds is not used
      linkTypeId: null, // linkTypeId is not used
      data: {[attributeId]: value},
    };
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public onEdit() {
    // this.setEditedAttribute();
    this.store$.dispatch(new TablesAction.EditSelectedCell({}));
  }

  public onValueChange(value: any) {
    this.editedValue = value;

    if (!value && this.cursor.partIndex > 1) {
      this.suggesting$.next(true);
    }
  }

  public onValueSave(value: any) {
    if (value !== null && value !== undefined) {
      this.useSelectionOrSave(value);
    }
    this.editing$.next(false);
  }

  public onCancelEditing() {
    this.editing$.next(false);
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

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (this.editing$.getValue()) {
      this.onKeyDownInEditMode(event);
    } else {
      this.onKeyDownInSelectionMode(event);
    }
  }

  public onKeyDownInEditMode(event: KeyboardEvent) {
    event.stopPropagation();

    switch (event.code) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        return this.suggestions && this.suggestions.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        event.preventDefault();
        return this.suggestions && this.suggestions.moveSelection(Direction.Up);
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
        // needs to be executed after the value is stored
        setTimeout(() => this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down})));
        return;
      case KeyCode.Tab:
        // needs to be executed after the value is stored
        setTimeout(() =>
          this.store$.dispatch(
            new TablesAction.MoveCursor({direction: event.shiftKey ? Direction.Left : Direction.Right})
          )
        );
        return;
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onKeyDownInSelectionMode(event: KeyboardEvent) {
    const writeWithView = this.allowedPermissions && this.allowedPermissions.writeWithView;
    event[EDITABLE_EVENT] = writeWithView;

    if (event.altKey && event.shiftKey && writeWithView && this.canManageConfig) {
      event.stopPropagation();
      switch (event.code) {
        case KeyCode.ArrowRight:
          this.store$.dispatch(new TablesAction.IndentRow({cursor: this.cursor}));
          return;
        case KeyCode.ArrowLeft:
          this.store$.dispatch(new TablesAction.OutdentRow({cursor: this.cursor}));
          return;
        case KeyCode.ArrowUp:
          this.store$.dispatch(new TablesAction.MoveRowUp({cursor: this.cursor}));
          this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
          return;
        case KeyCode.ArrowDown:
          this.store$.dispatch(new TablesAction.MoveRowDown({cursor: this.cursor}));
          this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
          return;
      }
    }
  }
}
