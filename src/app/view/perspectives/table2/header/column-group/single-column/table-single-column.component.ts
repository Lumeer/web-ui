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
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
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
import {extractAttributeLastName, extractAttributeParentName, filterAttributesByDepth, generateAttributeName, splitAttributeName} from '../../../../../../shared/utils/attribute.utils';
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
  public lastName: string;

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
            && this.cursor.columnPath[0] === this.getPart().columns.length - 1 && this.attribute && this.attribute.id) {
            const attributeName = generateAttributeName(this.getAttributes());
            const column = new TableCompoundColumn(new TableSingleColumn(null, attributeName), []);
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
    this.attribute = this.findAttribute(attributes) || {name: this.column.attributeName, constraints: []};
    this.lastName = extractAttributeLastName(this.attribute.name);
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

    if (!this.attribute || !this.attribute.id || this.originalLastName() !== this.lastName) {
      return stripedBackground(color, stripeColor);
    }

    return color;
  }

  public originalLastName(): string {
    return extractAttributeLastName(this.attribute.name);
  }

  public onValueChange(lastName: string) {
    this.lastName = lastName;
  }

  public onEditStart() {
    this.edited = true;
  }

  public onEditEnd(lastName: string) {
    this.edited = false;

    if (this.hasAttributeNameChanged(lastName) && this.isUniqueAttributeName(lastName)) {
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

  private hasAttributeNameChanged(lastName: string): boolean {
    return lastName && this.attribute && ((this.attribute.id && lastName !== this.originalLastName()) || !this.attribute.id);
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
    return this.edited && this.attribute && !this.attribute.id && this.lastName && !extractAttributeParentName(this.attribute.name);
  }

  public suggestedAttributeName(): string {
    if (!this.attribute) {
      return '';
    }

    const parentName = extractAttributeParentName(this.attribute.name);
    if (parentName) {
      return `${parentName}.${this.lastName}`;
    }

    return this.lastName;
  }

  private getPart(): TablePart {
    return this.table.parts[this.cursor.partIndex];
  }

}
