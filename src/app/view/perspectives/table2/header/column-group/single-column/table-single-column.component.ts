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

import {ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../../../core/store/app.state';
import {AttributeModel, CollectionModel} from '../../../../../../core/store/collections/collection.model';
import {selectCollectionById} from '../../../../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../../../../core/store/link-types/link-type.model';
import {selectLinkTypeById} from '../../../../../../core/store/link-types/link-types.state';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {areTableHeaderCursorsEqual, TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableColumn, TableCompoundColumn, TableModel, TablePart, TableSingleColumn} from '../../../../../../core/store/tables/table.model';
import {findTableColumn, splitColumnPath} from '../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../core/store/tables/tables.action';
import {selectTableCursor} from '../../../../../../core/store/tables/tables.state';
import {Direction} from '../../../../../../shared/direction';
import {KeyCode} from '../../../../../../shared/key-code';
import {extractAttributeName, extractAttributeParentId, filterAttributesByDepth, generateAttributeId, splitAttributeId} from '../../../../../../shared/utils/attribute.utils';
import {HtmlModifier, stripedBackground} from '../../../../../../shared/utils/html-modifier';
import {TableEditableCellComponent} from '../../../shared/editable-cell/table-editable-cell.component';
import {TableColumnContextMenuComponent} from './context-menu/table-column-context-menu.component';

export const DEFAULT_COLOR = '#ffffff';

@Component({
  selector: 'table-single-column',
  templateUrl: './table-single-column.component.html'
})
export class TableSingleColumnComponent implements OnInit, OnDestroy {

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
  public attributeName: string;

  public selected: boolean;
  public edited: boolean;

  public subscriptions: Subscription = new Subscription();

  public constructor(private i18n: I18n,
                     private changeDetector: ChangeDetectorRef,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToSelected();
    this.loadEntity();
  }

  private subscribeToSelected() {
    this.subscriptions.add(
      this.store.select(selectTableCursor)
        .subscribe(cursor => {
          this.selected = areTableHeaderCursorsEqual(cursor, this.cursor);
          this.edited = this.selected ? this.edited : false;

          this.changeDetector.detectChanges();

          // TODO probably better to do in action
          if (this.selected && this.table.parts.length === 1 && this.cursor.columnPath.length === 1
            && this.cursor.columnPath[0] === this.getPart().columns.length - 1 && this.attribute) {
            const attributeId = generateAttributeId(this.getAttributes());
            const column = new TableCompoundColumn(new TableSingleColumn(attributeId), []);
            const cursor = {...this.cursor, columnPath: [this.cursor.columnPath[0] + 1]};
            this.store.dispatch(new TablesAction.AddColumn({cursor, column}));
          }
        })
    );
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
    this.attribute = this.findAttribute(attributes);
    this.attributeName = this.attribute ? this.attribute.name : extractAttributeName(this.column.attributeId);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private findAttribute(attributes: AttributeModel[]) {
    return attributes.find(attribute => attribute.id === this.column.attributeId);
  }

  public background(): string {
    const color = this.collection ? HtmlModifier.shadeColor(this.collection.color, .5) : DEFAULT_COLOR;
    const stripeColor = this.collection ? HtmlModifier.shadeColor(color, .25) : '#eeeeee';

    if (!this.attribute || this.attribute.name !== this.attributeName) {
      return stripedBackground(color, stripeColor);
    }

    return color;
  }

  public value(): string {
    return this.attribute ? this.attribute.name : extractAttributeName(this.column.attributeId);
  }

  public onValueChange(attributeName: string) {
    this.attributeName = attributeName;
  }

  public onEditStart() {
    this.edited = true;
  }

  public onEditEnd(attributeName: string) {
    this.edited = false;

    if (this.hasAttributeNameChanged(attributeName) && this.isUniqueAttributeName(attributeName)) {
      this.renameColumn(attributeName);
    }
  }

  private renameColumn(attributeName: string) {
    this.store.dispatch(new TablesAction.RenameColumn({cursor: this.cursor, name: attributeName}));
  }

  private hasAttributeNameChanged(attributeName: string): boolean {
    return attributeName && ((this.attribute && attributeName !== this.attribute.name) || !this.attribute);
  }

  public isUniqueAttributeName(attributeName: string): boolean {
    if (this.cursor.columnPath.length === 1) {
      return filterAttributesByDepth(this.getAttributes(), 1)
        .filter(attribute => this.attribute ? this.attribute.id !== attribute.id : true)
        .every(attribute => attribute.name !== attributeName);
    }

    const parent = findTableColumn(this.getPart().columns, this.cursor.columnPath.slice(0, -1)) as TableCompoundColumn;
    const prefix = `${parent.parent.attributeId}.`;
    return this.getAttributes()
      .filter(attribute => attribute.id.startsWith(prefix))
      .filter(attribute => this.attribute ? this.attribute.id !== attribute.id : true)
      .every(attribute => attribute.name !== attributeName);
  }

  public onAdd(next: boolean) {
    const {parentPath, columnIndex} = splitColumnPath(this.cursor.columnPath);
    const columnPath = parentPath.concat(columnIndex + (next ? 1 : 0));
    const cursor = {...this.cursor, columnPath};
    this.store.dispatch(new TablesAction.AddColumn({cursor, column: this.createNewColumn()}));
  }

  private createNewColumn(): TableColumn {
    const {parentId} = splitAttributeId(this.column.attributeId);
    const attributeId = generateAttributeId(this.getAttributes(), parentId);
    return new TableCompoundColumn(new TableSingleColumn(attributeId), []);
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

  public attributeId(): string {
    if (this.attribute) {
      return this.attribute.id;
    }

    const parentId = this.parentAttributeId();
    if (parentId) {
      return `${parentId}.${this.attributeName}`;
    }

    return this.attributeName;
  }

  private parentAttributeId(): string {
    if (this.cursor.columnPath.length < 2) {
      return null;
    }

    if (this.attribute) {
      return extractAttributeParentId(this.attribute.id);
    }

    const {parentPath} = splitColumnPath(this.cursor.columnPath);
    const parent = findTableColumn(this.getPart().columns, parentPath) as TableCompoundColumn;
    return parent.parent.attributeId;
  }

  public dragClass(): string {
    const path = [...this.cursor.columnPath];
    path.pop();
    return `drag-${this.cursor.tableId}-${this.cursor.partIndex}-${path.join('-')}`;
  }

  public contextMenuElement(): ElementRef {
    return this.contextMenuComponent ? this.contextMenuComponent.contextMenu : null;
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
    if (!this.selected) {
      this.store.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.LeftArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Left}));
      case KeyCode.UpArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Up}));
      case KeyCode.RightArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Right}));
      case KeyCode.DownArrow:
        return this.store.dispatch(new TablesAction.MoveCursor({cursor: this.cursor, direction: Direction.Down}));
    }
  }

  public canShowSuggestions(): boolean {
    return this.edited && this.collection && !this.attribute && this.attributeName && !this.parentAttributeId();
  }

  private getPart(): TablePart {
    return this.table.parts[this.cursor.partIndex];
  }

}
