/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ContextMenuService} from 'ngx-contextmenu';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, switchMap, take} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {findAttribute} from '../../../../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {areTableHeaderCursorsEqual, TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableConfigColumn, TableModel} from '../../../../../../core/store/tables/table.model';
import {findTableColumn, getTablePart, splitColumnPath} from '../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../core/store/tables/tables.action';
import {selectTableCursorSelected} from '../../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../../../../shared/key-code';
import {
  extractAttributeLastName,
  extractAttributeParentName,
  filterAttributesByDepth,
  filterOutInvalidAttributeNameCharacters,
} from '../../../../../../shared/utils/attribute.utils';
import {AttributeNameChangedPipe} from '../../../shared/pipes/attribute-name-changed.pipe';
import {ColumnBackgroundPipe} from '../../../shared/pipes/column-background.pipe';
import {TableAttributeSuggestionsComponent} from './attribute-suggestions/table-attribute-suggestions.component';
import {TableColumnContextMenuComponent} from './context-menu/table-column-context-menu.component';
import {BsModalService} from 'ngx-bootstrap';
import {ModalService} from '../../../../../../shared/modal/modal.service';

@Component({
  selector: 'table-single-column',
  templateUrl: './table-single-column.component.html',
  styleUrls: ['./table-single-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSingleColumnComponent implements OnInit, OnChanges {
  @Input()
  public table: TableModel;

  @Input()
  public cursor: TableHeaderCursor;

  @Input()
  public column: TableConfigColumn;

  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public leaf: boolean;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @ViewChild(TableAttributeSuggestionsComponent, {static: false})
  public suggestions: TableAttributeSuggestionsComponent;

  @ViewChild(TableColumnContextMenuComponent, {static: false})
  public contextMenuComponent: TableColumnContextMenuComponent;

  private attributes: Attribute[];
  public attribute: Attribute;

  public lastName$ = new BehaviorSubject('');

  private cursor$ = new BehaviorSubject<TableHeaderCursor>(null);

  public edited$ = new BehaviorSubject(false);
  public selected$: Observable<boolean>;

  private selectedSubscriptions = new Subscription();
  private subscriptions = new Subscription();

  public constructor(
    private actions$: Actions,
    private attributeNameChangedPipe: AttributeNameChangedPipe,
    private changeDetector: ChangeDetectorRef,
    private columnBackgroundPipe: ColumnBackgroundPipe,
    private contextMenuService: ContextMenuService,
    private bsModalService: BsModalService,
    private modalService: ModalService,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.selected$ = this.bindSelected();
    this.subscriptions.add(this.subscribeToSelected());
  }

  private bindSelected(): Observable<boolean> {
    return this.cursor$.pipe(
      switchMap(cursor =>
        this.store$.pipe(
          select(selectTableCursorSelected(cursor)),
          distinctUntilChanged()
        )
      )
    );
  }

  private subscribeToSelected(): Subscription {
    return this.selected$.subscribe(selected => {
      this.selectedSubscriptions.unsubscribe();
      if (selected) {
        this.selectedSubscriptions = new Subscription();
        this.selectedSubscriptions.add(this.subscribeToEditSelectedCell());
        this.selectedSubscriptions.add(this.subscribeToRemoveSelectedCell());
      } else {
        this.edited$.next(false);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && !areTableHeaderCursorsEqual(changes.cursor.previousValue, changes.cursor.currentValue)) {
      this.cursor$.next(this.cursor);
    }
    if (changes.collection || changes.linkType) {
      this.bindAttribute();
    }
  }

  private bindAttribute() {
    this.attributes = this.extractAttributes();
    this.attribute = findAttribute(this.attributes, this.column.attributeIds[0]) || {name: this.column.attributeName};

    if (!this.lastName$.getValue()) {
      this.lastName$.next(extractAttributeLastName(this.attribute.name));
    }
  }

  private extractAttributes(): Attribute[] {
    if (this.collection) {
      return this.collection.attributes;
    }
    if (this.linkType) {
      return this.linkType.attributes;
    }
    return [];
  }

  private subscribeToEditSelectedCell(): Subscription {
    return this.actions$
      .pipe(ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL))
      .subscribe(action => {
        if (action.payload.clear) {
          this.lastName$.next('');
        }
        if (action.payload.value) {
          const safeValue = filterOutInvalidAttributeNameCharacters(action.payload.value);
          this.lastName$.next(safeValue);
        }
        this.startEditing();
      });
  }

  private subscribeToRemoveSelectedCell(): Subscription {
    return this.actions$
      .pipe(ofType<TablesAction.RemoveSelectedCell>(TablesActionType.REMOVE_SELECTED_CELL))
      .subscribe(() => this.onRemove());
  }

  public ngOnDestroy() {
    this.selectedSubscriptions.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  public onValueChange(lastName: string) {
    this.lastName$.next(lastName);
  }

  public onCancel() {
    this.stopEditing();
    this.lastName$.next(extractAttributeLastName(this.attribute.name));
  }

  public onSave(lastName: string) {
    this.stopEditing();

    if (!lastName) {
      return;
    }

    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
      return;
    }

    if (
      this.attributeNameChangedPipe.transform(this.attribute, lastName) &&
      this.isUniqueAttributeName(this.attributes, this.attribute ? this.attribute.id : null, lastName)
    ) {
      this.renameAttribute(this.attribute, lastName);
    }
  }

  private renameAttribute(oldAttribute: Attribute, lastName: string) {
    const parentName = extractAttributeParentName(oldAttribute.name);
    const name = parentName ? `${parentName}.${lastName}` : lastName;
    const attribute = {...oldAttribute, name};

    if (this.collection) {
      this.renameCollectionAttribute(attribute);
    }
    if (this.linkType) {
      this.renameLinkTypeAttribute(attribute);
    }
  }

  private renameCollectionAttribute(attribute: Attribute) {
    if (attribute.id) {
      this.updateCollectionAttribute(attribute);
    } else {
      this.renameUninitializedTableColumn(attribute);
      this.createCollectionAttribute(attribute);
    }
  }

  private renameUninitializedTableColumn(attribute: Attribute) {
    this.store$.dispatch(
      new TablesAction.ReplaceColumns({
        cursor: this.cursor,
        deleteCount: 1,
        columns: [{...this.column, attributeName: extractAttributeLastName(attribute.name)}],
      })
    );
  }

  private createCollectionAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.collection.id,
        attributes: [attribute],
      })
    );
  }

  private updateCollectionAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId: this.collection.id,
        attributeId: attribute.id,
        attribute,
      })
    );
  }

  private renameLinkTypeAttribute(attribute: Attribute) {
    if (attribute.id) {
      this.updateLinkTypeAttribute(attribute);
    } else {
      this.renameUninitializedTableColumn(attribute);
      this.createLinkTypeAttribute(attribute);
    }
  }

  private createLinkTypeAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.CreateAttributes({
        linkTypeId: this.linkType.id,
        attributes: [attribute],
      })
    );
  }

  private updateLinkTypeAttribute(attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.UpdateAttribute({
        linkTypeId: this.linkType.id,
        attributeId: attribute.id,
        attribute,
      })
    );
  }

  public isUniqueAttributeName(attributes: Attribute[], attributeId: string, lastName: string): boolean {
    if (this.cursor.columnPath.length === 1) {
      return filterAttributesByDepth(attributes, 1)
        .filter(attribute => attributeId !== attribute.id)
        .every(attribute => attribute.name !== lastName);
    }

    const part = getTablePart(this.table, this.cursor);
    const parentColumn = findTableColumn(part.columns, this.cursor.columnPath.slice(0, -1));
    const parentAttribute = attributes.find(attribute => attribute.id === parentColumn.attributeIds[0]);
    const prefix = `${parentAttribute.name}.`;
    return attributes
      .filter(attribute => attribute.name.startsWith(prefix))
      .filter(attribute => attributeId !== attribute.id)
      .every(attribute => extractAttributeLastName(attribute.name) !== lastName);
  }

  public onAdd(next: boolean) {
    const {parentPath, columnIndex} = splitColumnPath(this.cursor.columnPath);
    const columnPath = parentPath.concat(columnIndex + 1);
    const nextCursor = {...this.cursor, columnPath};
    this.store$.dispatch(new TablesAction.AddColumn({cursor: next ? nextCursor : this.cursor}));
    if (!next) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: nextCursor}));
    }
  }

  public onConfigure() {
    const collectionId = this.collection && this.collection.id;
    const linkTypeId = this.linkType && this.linkType.id;
    this.modalService.showAttributeType(this.attribute.id, collectionId, linkTypeId);
  }

  public onFunctionEdit() {
    this.modalService.showAttributeFunction(
      this.attribute.id,
      this.collection && this.collection.id,
      this.linkType && this.linkType.id
    );
  }

  public onEdit() {
    this.startEditing();
  }

  public onHide() {
    this.store$.dispatch(new TablesAction.HideColumn({cursor: this.cursor}));
  }

  public onSplit() {
    this.store$.dispatch(new TablesAction.SplitColumn({cursor: this.cursor}));
  }

  public onRemove() {
    if (this.attribute && this.attribute.id) {
      this.showRemoveConfirm();
    } else {
      this.removeUninitializedColumn();
    }
  }

  private showRemoveConfirm() {
    const removeAction = new TablesAction.RemoveColumn({cursor: this.cursor});
    const confirmAction = this.createConfirmAction(removeAction);
    this.store$.dispatch(confirmAction);
  }

  private createConfirmAction(action: Action): NotificationsAction.Confirm {
    const title = this.i18n({id: 'table.delete.column.dialog.title', value: 'Delete this column?'});
    const message = this.i18n({
      id: 'table.delete.column.dialog.message',
      value: 'Do you really want to delete the column? This will permanently remove the attribute and all its data.',
    });

    return new NotificationsAction.Confirm({title, message, action});
  }

  private removeUninitializedColumn() {
    this.store$.dispatch(new TablesAction.RemoveColumn({cursor: this.cursor}));
  }

  public onDoubleClick() {
    this.startEditing();
  }

  private startEditing() {
    if (this.allowedPermissions && this.allowedPermissions.writeWithView) {
      this.edited$.next(true);
    }
  }

  private stopEditing() {
    this.edited$.next(false);

    this.selected$.pipe(take(1)).subscribe(selected => {
      if (selected) {
        // sets focus to hidden input
        this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
      }
    });
  }

  public onMouseDown() {
    if (!this.edited$.getValue()) {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  public onSetDefaultAttribute() {
    if (this.collection) {
      this.setDefaultCollectionAttribute();
    }
  }

  private setDefaultCollectionAttribute() {
    this.store$.dispatch(
      new CollectionsAction.SetDefaultAttribute({
        collectionId: this.collection.id,
        attributeId: this.column.attributeIds[0],
      })
    );
  }

  public onKeyDown(event: KeyboardEvent) {
    event.stopPropagation();

    switch (event.code) {
      case KeyCode.ArrowDown:
        return this.suggestions && this.suggestions.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        return this.suggestions && this.suggestions.moveSelection(Direction.Up);
      case KeyCode.Tab:
        return this.store$.dispatch(
          new TablesAction.MoveCursor({direction: event.shiftKey ? Direction.Left : Direction.Right})
        );
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onContextMenu(event: MouseEvent) {
    if (!this.contextMenuComponent) {
      return;
    }

    this.contextMenuService.show.next({
      contextMenu: this.contextMenuComponent.contextMenu,
      event,
      item: null,
    });

    event.preventDefault();
    event.stopPropagation();
  }
}
