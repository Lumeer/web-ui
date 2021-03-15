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
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
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
  filterAttributesByDepth,
  filterOutInvalidAttributeNameCharacters,
} from '../../../../../../shared/utils/attribute.utils';
import {AttributeNameChangedPipe} from '../../../shared/pipes/attribute-name-changed.pipe';
import {TableAttributeSuggestionsComponent} from './attribute-suggestions/table-attribute-suggestions.component';
import {TableColumnContextMenuComponent} from './context-menu/table-column-context-menu.component';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {computeElementPositionInParent, preventEvent} from '../../../../../../shared/utils/common.utils';

@Component({
  selector: 'table-single-column',
  templateUrl: './table-single-column.component.html',
  styleUrls: ['./table-single-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'position-relative'},
})
export class TableSingleColumnComponent implements OnInit, OnChanges, OnDestroy {
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

  @Input()
  public embedded: boolean;

  @ViewChild(TableAttributeSuggestionsComponent)
  public suggestions: TableAttributeSuggestionsComponent;

  @ViewChild(TableColumnContextMenuComponent)
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
    private modalService: ModalService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.selected$ = this.bindSelected();
    this.subscriptions.add(this.subscribeToSelected());
  }

  private bindSelected(): Observable<boolean> {
    return this.cursor$.pipe(
      switchMap(cursor => this.store$.pipe(select(selectTableCursorSelected(cursor)), distinctUntilChanged()))
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
        if (this.allowedPermissions?.writeWithView) {
          if (action.payload.clear) {
            this.lastName$.next('');
          }
          if (action.payload.value) {
            const safeValue = filterOutInvalidAttributeNameCharacters(action.payload.value);
            this.lastName$.next(safeValue);
          }
          this.startEditing();
        }
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

    if (this.suggestions?.isSelected()) {
      this.lastName$.next(lastName);
      this.suggestions.useSelection();
      return;
    }

    if (
      lastName &&
      this.attributeNameChangedPipe.transform(this.attribute, lastName) &&
      this.isUniqueAttributeName(this.attributes, this.attribute?.id || null, lastName)
    ) {
      this.lastName$.next(lastName);
      this.renameAttribute(this.attribute, lastName);
    } else {
      const previousName = this.lastName$.value;
      this.lastName$.next(this.attribute?.name || previousName);
      if (lastName !== previousName) {
        this.store$.dispatch(new NotificationsAction.ExistingAttributeWarning({name: lastName}));
      }
    }
  }

  private renameAttribute(oldAttribute: Attribute, name: string) {
    if (this.collection) {
      this.renameCollectionAttribute(oldAttribute, name);
    }
    if (this.linkType) {
      this.renameLinkTypeAttribute(oldAttribute, name);
    }
  }

  private renameCollectionAttribute(attribute: Attribute, name: string) {
    if (attribute.id) {
      this.renameExistingCollectionAttribute(attribute, name);
    } else {
      this.renameUninitializedTableColumn(name);
      this.createCollectionAttribute(attribute, name);
    }
  }

  private renameUninitializedTableColumn(name: string) {
    this.store$.dispatch(
      new TablesAction.ReplaceColumns({
        cursor: this.cursor,
        deleteCount: 1,
        columns: [{...this.column, attributeName: name}],
      })
    );
  }

  private createCollectionAttribute(attribute: Attribute, name: string) {
    this.store$.dispatch(
      new CollectionsAction.CreateAttributes({
        collectionId: this.collection.id,
        attributes: [{...attribute, name}],
      })
    );
  }

  private renameExistingCollectionAttribute(attribute: Attribute, name: string) {
    this.store$.dispatch(
      new CollectionsAction.RenameAttribute({
        collectionId: this.collection.id,
        attributeId: attribute.id,
        name,
      })
    );
  }

  private renameLinkTypeAttribute(attribute: Attribute, name: string) {
    if (attribute.id) {
      this.renameExistingLinkTypeAttribute(attribute, name);
    } else {
      this.renameUninitializedTableColumn(name);
      this.createLinkTypeAttribute(attribute, name);
    }
  }

  private createLinkTypeAttribute(attribute: Attribute, name: string) {
    this.store$.dispatch(
      new LinkTypesAction.CreateAttributes({
        linkTypeId: this.linkType.id,
        attributes: [{...attribute, name}],
      })
    );
  }

  private renameExistingLinkTypeAttribute(attribute: Attribute, name: string) {
    this.store$.dispatch(
      new LinkTypesAction.RenameAttribute({
        linkTypeId: this.linkType.id,
        attributeId: attribute.id,
        name,
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
    this.modalService.showAttributeType(this.attribute.id, this.collection?.id, this.linkType?.id);
  }

  public onFunctionEdit() {
    this.modalService.showAttributeFunction(this.attribute.id, this.collection?.id, this.linkType?.id);
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
    const title = $localize`:@@table.delete.column.dialog.title:Delete this column?`;
    const message = $localize`:@@table.delete.column.dialog.message:Do you really want to delete the column? This will permanently remove the attribute and all its data.`;

    return new NotificationsAction.Confirm({title, message, action, type: 'danger'});
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

  public onClick() {
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
        return this.suggestions?.moveSelection(Direction.Down);
      case KeyCode.ArrowUp:
        return this.suggestions?.moveSelection(Direction.Up);
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
    const {x, y} = computeElementPositionInParent(event, 'table-single-column');
    this.contextMenuComponent?.open(x, y);

    preventEvent(event);
  }

  public onDescriptionEdit() {
    this.modalService.showAttributeDescription(this.attribute.id, this.collection?.id, this.linkType?.id);
  }
}
