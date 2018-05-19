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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {Actions} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {first, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {selectCollectionById} from '../../../../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../../../../core/store/link-types/link-type.model';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {areTableHeaderCursorsEqual, TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableColumn, TableCompoundColumn, TableModel, TablePart, TableSingleColumn} from '../../../../../../core/store/tables/table.model';
import {findTableColumn, splitColumnPath} from '../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../core/store/tables/tables.action';
import {selectTableCursorSelected} from '../../../../../../core/store/tables/tables.state';
import {extractAttributeLastName, extractAttributeParentName, filterAttributesByDepth, generateAttributeName, splitAttributeName} from '../../../../../../shared/utils/attribute.utils';
import {TableEditableCellComponent} from '../../../shared/editable-cell/table-editable-cell.component';
import {AttributeNameChangedPipe} from '../../../shared/pipes/attribute-name-changed.pipe';
import {TableColumnContextMenuComponent} from './context-menu/table-column-context-menu.component';

@Component({
  selector: 'table-single-column',
  templateUrl: './table-single-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableSingleColumnComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public column: TableSingleColumn;

  @Input()
  public leaf: boolean;

  @ViewChild(TableEditableCellComponent)
  public editableCellComponent: TableEditableCellComponent;

  @ViewChild(TableColumnContextMenuComponent)
  public contextMenuComponent: TableColumnContextMenuComponent;

  public collection: CollectionModel;
  public linkType: LinkTypeModel;

  public attribute: AttributeModel;
  public lastName: string;

  public selected$: Observable<boolean>;
  public edited: boolean;

  private editSubscription: Subscription;
  public subscriptions: Subscription = new Subscription();

  public constructor(private actions$: Actions,
                     private attributeNameChangedPipe: AttributeNameChangedPipe,
                     private i18n: I18n,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.loadEntity();
  }

  private loadEntity() {
    if (this.getPart().collectionId) {
      this.loadCollection();
    }
    if (this.getPart().linkTypeId) {
      this.loadLinkType();
    }
  }

  private loadCollection() {
    this.subscriptions.add(
      this.store.select(selectCollectionById(this.getPart().collectionId)).subscribe(collection => {
        this.collection = collection;
        this.initializeAttribute(this.collection.attributes);
      })
    );
  }

  private loadLinkType() {
    this.subscriptions.add(
      this.store.select(selectLinkTypeById(this.getPart().linkTypeId)).subscribe(linkType => {
        this.linkType = linkType;
        this.initializeAttribute(this.linkType.attributes);
      })
    );
  }

  private initializeAttribute(attributes: AttributeModel[]) {
    this.attribute = this.findAttribute(attributes) || {name: this.column.attributeName, constraints: []};
    this.lastName = extractAttributeLastName(this.attribute.name);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && !areTableHeaderCursorsEqual(changes.cursor.previousValue, changes.cursor.currentValue)) {
      this.bindToSelected();
    }
  }

  private bindToSelected() {
    this.selected$ = this.store.select(selectTableCursorSelected(this.cursor)).pipe(
      // TODO do not use tap as selected$ might be used several times
      tap(selected => {
        this.edited = selected ? this.edited : false;

        this.bindOrUnbindEditSelectedCell(selected);

        // TODO probably better to do in action
        if (selected && this.table.parts.length === 1 && this.cursor.columnPath.length === 1
          && this.cursor.columnPath[0] === this.getPart().columns.length - 1 && this.attribute && this.attribute.id) {
          const attributeName = generateAttributeName(this.getAttributes());
          const column = new TableCompoundColumn(new TableSingleColumn(null, attributeName), []);
          const cursor = {...this.cursor, columnPath: [this.cursor.columnPath[0] + 1]};
          this.store.dispatch(new TablesAction.AddColumn({cursor, column}));
        }
      })
    );
  }

  private bindOrUnbindEditSelectedCell(selected: boolean) {
    if (selected) {
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

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private findAttribute(attributes: AttributeModel[]) {
    return attributes.find(attribute => attribute.id === this.column.attributeId);
  }

  public onValueChange(lastName: string) {
    this.lastName = lastName;
  }

  public onEditStart() {
    this.edited = true;
  }

  public onEditEnd(lastName: string) {
    this.edited = false;

    if (this.attributeNameChangedPipe.transform(this.attribute, lastName) && this.isUniqueAttributeName(lastName)) {
      this.renameAttribute(lastName);
    }
  }

  private renameAttribute(lastName: string) {
    const parentName = extractAttributeParentName(this.attribute.name);
    const name = parentName ? `${parentName}.${lastName}` : lastName;
    const attribute = {...this.attribute, name};

    if (this.collection) {
      this.renameCollectionAttribute(attribute);
    }
    if (this.linkType) {
      // TODO
    }
  }

  private renameCollectionAttribute(attribute: AttributeModel) {
    if (this.attribute.id) {
      this.updateCollectionAttribute(attribute);
    } else {
      this.createCollectionAttribute(attribute);
    }
  }

  private createCollectionAttribute(attribute: AttributeModel) {
    const nextAction = new TablesAction.InitColumn({
      cursor: this.cursor,
      attributeId: null
    });

    this.store.dispatch(new CollectionsAction.CreateAttributes({
      collectionId: this.collection.id,
      attributes: [attribute],
      nextAction
    }));
  }

  private updateCollectionAttribute(attribute: AttributeModel) {
    this.store.dispatch(new CollectionsAction.ChangeAttribute({
      collectionId: this.collection.id,
      attributeId: this.attribute.id,
      attribute
    }));
  }

  public isUniqueAttributeName(lastName: string): boolean {
    if (this.cursor.columnPath.length === 1) {
      return filterAttributesByDepth(this.getAttributes(), 1)
        .filter(attribute => this.attribute.id !== attribute.id)
        .every(attribute => attribute.name !== lastName);
    }

    const parentColumn = findTableColumn(this.getPart().columns, this.cursor.columnPath.slice(0, -1)) as TableCompoundColumn;
    const parentAttribute = this.getAttributes().find(attribute => attribute.id === parentColumn.parent.attributeId);
    const prefix = `${parentAttribute.name}.`;
    return this.getAttributes()
      .filter(attribute => attribute.name.startsWith(prefix))
      .filter(attribute => this.attribute.id !== attribute.id)
      .every(attribute => extractAttributeLastName(attribute.name) !== lastName);
  }

  public onAdd(next: boolean) {
    const {parentPath, columnIndex} = splitColumnPath(this.cursor.columnPath);
    const columnPath = parentPath.concat(columnIndex + (next ? 1 : 0));
    const cursor = {...this.cursor, columnPath};
    this.store.dispatch(new TablesAction.AddColumn({cursor, column: this.createNewColumn()}));
  }

  private createNewColumn(): TableColumn {
    const {parentName} = splitAttributeName(this.column.attributeId);
    const attributeName = generateAttributeName(this.getAttributes(), parentName);
    return new TableCompoundColumn(new TableSingleColumn(null, attributeName), []);
  }

  public onEdit() {
    this.editableCellComponent.startEditing();
  }

  public onHide() {
    this.store.dispatch(new TablesAction.HideColumn({cursor: this.cursor}));
  }

  public onSplit() {
    this.store.dispatch(new TablesAction.SplitColumn({cursor: this.cursor}));
  }

  public onRemove() {
    if (this.attribute) {
      this.showRemoveConfirm();
    } else {
      this.removeUninitializedColumn();
    }
  }

  private showRemoveConfirm() {
    const removeAction = new TablesAction.RemoveColumn({cursor: this.cursor});
    const confirmAction = this.createConfirmAction(removeAction);
    this.store.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action): NotificationsAction.Confirm {
    const title = this.i18n({id: 'table.delete.column.dialog.title', value: 'Delete this column?'});
    const message = this.i18n({id: 'table.delete.column.dialog.message', value: 'Deleting a column will permanently remove the attribute from the file.'});

    return new NotificationsAction.Confirm({title, message, action});
  }

  private removeUninitializedColumn() {
    this.store.dispatch(new TablesAction.RemoveColumn({cursor: this.cursor}));
  }

  private getAttributes(): AttributeModel[] {
    if (this.collection) {
      return this.collection.attributes;
    }
    if (this.linkType) {
      return this.linkType.attributes;
    }
    return [];
  }

  public onMouseDown() {
    if (!this.edited) {
      this.store.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  private getPart(): TablePart {
    return this.table.parts[this.cursor.partIndex];
  }

}
