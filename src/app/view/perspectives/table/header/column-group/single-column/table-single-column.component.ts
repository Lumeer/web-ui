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
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ContextMenuService} from 'ngx-contextmenu';
import {Observable, Subscription} from 'rxjs';
import {first, map, tap} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../../../core/store/collections/collection';
import {CollectionsAction} from '../../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../../../../core/store/link-types/link.type';
import {NotificationsAction} from '../../../../../../core/store/notifications/notifications.action';
import {areTableHeaderCursorsEqual, TableHeaderCursor} from '../../../../../../core/store/tables/table-cursor';
import {TableConfigColumn, TableModel} from '../../../../../../core/store/tables/table.model';
import {findTableColumn, getTablePart, splitColumnPath} from '../../../../../../core/store/tables/table.utils';
import {TablesAction, TablesActionType} from '../../../../../../core/store/tables/tables.action';
import {selectTableCursorSelected} from '../../../../../../core/store/tables/tables.selector';
import {DialogService} from '../../../../../../dialog/dialog.service';
import {Direction} from '../../../../../../shared/direction';
import {isKeyPrintable, KeyCode} from '../../../../../../shared/key-code';
import {
  extractAttributeLastName,
  extractAttributeParentName,
  filterAttributesByDepth,
} from '../../../../../../shared/utils/attribute.utils';
import {TableEditableCellDirective} from '../../../shared/directives/table-editable-cell.directive';
import {AttributeNameChangedPipe} from '../../../shared/pipes/attribute-name-changed.pipe';
import {ColumnBackgroundPipe} from '../../../shared/pipes/column-background.pipe';
import {EDITABLE_EVENT} from '../../../table-perspective.component';
import {TableAttributeSuggestionsComponent} from './attribute-suggestions/table-attribute-suggestions.component';
import {TableColumnContextMenuComponent} from './context-menu/table-column-context-menu.component';
import {selectServiceLimitsByWorkspace} from '../../../../../../core/store/organizations/service-limits/service-limits.state';
import {RouterAction} from '../../../../../../core/store/router/router.action';
import {selectOrganizationByWorkspace} from '../../../../../../core/store/organizations/organizations.state';

@Component({
  selector: 'table-single-column',
  templateUrl: './table-single-column.component.html',
  styleUrls: ['./table-single-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSingleColumnComponent implements OnChanges {
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

  @ViewChild(TableEditableCellDirective)
  public editableCellDirective: TableEditableCellDirective;

  @ViewChild(TableAttributeSuggestionsComponent)
  public suggestions: TableAttributeSuggestionsComponent;

  @ViewChild(TableColumnContextMenuComponent)
  public contextMenuComponent: TableColumnContextMenuComponent;

  @HostBinding('style.background')
  public background: string;

  private attributes: Attribute[];
  public attribute: Attribute;

  public lastName: string;

  public selected$: Observable<boolean>;
  public edited: boolean;
  public functionsCountLimit$: Observable<number>;

  public readonly disabledCharacters = ['.'];

  private selectedSubscriptions = new Subscription();

  public constructor(
    private actions$: Actions,
    private attributeNameChangedPipe: AttributeNameChangedPipe,
    private changeDetector: ChangeDetectorRef,
    private columnBackgroundPipe: ColumnBackgroundPipe,
    private contextMenuService: ContextMenuService,
    private dialogService: DialogService,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cursor && !areTableHeaderCursorsEqual(changes.cursor.previousValue, changes.cursor.currentValue)) {
      this.bindToSelected();
    }
    if (changes.collection || changes.linkType) {
      this.bindAttribute();
      this.setBackground();
    }
    this.functionsCountLimit$ = this.store$.pipe(
      select(selectServiceLimitsByWorkspace),
      map(serviceLimits => serviceLimits.functionsPerCollection)
    );
  }

  private setBackground() {
    const nameChanged =
      !this.attribute || !this.attribute.id || extractAttributeLastName(this.attribute.name) !== this.lastName;
    this.background = this.columnBackgroundPipe.transform(this.collection, nameChanged);
  }

  private bindAttribute() {
    this.attributes = this.extractAttributes();
    this.attribute = this.findAttribute(this.attributes) || {name: this.column.attributeName};

    if (!this.lastName) {
      this.lastName = extractAttributeLastName(this.attribute.name);
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

  private findAttribute(attributes: Attribute[]) {
    return attributes.find(attribute => attribute.id === this.column.attributeIds[0]);
  }

  private bindToSelected() {
    this.selected$ = this.store$.pipe(
      select(selectTableCursorSelected(this.cursor)),
      // TODO do not use tap as selected$ might be used several times
      tap(selected => {
        this.edited = selected ? this.edited : false;

        this.selectedSubscriptions.unsubscribe();
        if (selected) {
          this.selectedSubscriptions = new Subscription();
          this.selectedSubscriptions.add(this.subscribeToEditSelectedCell());
          this.selectedSubscriptions.add(this.subscribeToRemoveSelectedCell());
        }
      })
    );
  }

  private subscribeToEditSelectedCell(): Subscription {
    return this.actions$
      .pipe(ofType<TablesAction.EditSelectedCell>(TablesActionType.EDIT_SELECTED_CELL))
      .subscribe(action => this.editableCellDirective.startEditing(action.payload.clear));
  }

  private subscribeToRemoveSelectedCell(): Subscription {
    return this.actions$
      .pipe(ofType<TablesAction.RemoveSelectedCell>(TablesActionType.REMOVE_SELECTED_CELL))
      .subscribe(() => this.onRemove());
  }

  public ngOnDestroy() {
    this.selectedSubscriptions.unsubscribe();
  }

  public onValueChange(lastName: string) {
    this.lastName = lastName;
    this.setBackground();
  }

  public onEditStart() {
    this.edited = true;
  }

  public onEditEnd(lastName: string) {
    this.edited = false;
    if (!lastName || this.dialogService.isDialogOpen()) {
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
      // setTimeout(() => this.changeDetector.detectChanges());
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
    if (this.collection) {
      this.dialogService.openCollectionAttributeConfigDialog(this.collection.id, this.attribute.id);
    }
    if (this.linkType) {
      this.dialogService.openLinkTypeAttributeConfigDialog(this.linkType.id, this.attribute.id);
    }
  }

  public onFunctionEdit() {
    this.functionsCountLimit$.pipe(first()).subscribe(functionsCountLimit => {
      if (this.collection) {
        const functions = this.collection.attributes.filter(
          attribute => attribute.id !== this.attribute.id && !!attribute.function && !!attribute.function.js
        ).length;
        if (functionsCountLimit !== 0 && functions >= functionsCountLimit) {
          this.notifyFunctionsLimit();
        } else {
          this.dialogService.openCollectionAttributeFunction(this.collection.id, this.attribute.id);
        }
      }
      if (this.linkType) {
        const functions = this.linkType.attributes.filter(
          attribute => attribute.id !== this.attribute.id && !!attribute.function && !!attribute.function.js
        ).length;
        if (functionsCountLimit !== 0 && functions >= functionsCountLimit) {
          this.notifyFunctionsLimit();
        } else {
          this.dialogService.openLinkTypeAttributeFunction(this.linkType.id, this.attribute.id);
        }
      }
    });
  }

  private notifyFunctionsLimit() {
    this.store$
      .pipe(
        select(selectOrganizationByWorkspace),
        map(organization => organization.code),
        first()
      )
      .subscribe(code => {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'function.create.serviceLimits',
          value:
            'You can have only a single function per table/link type in the Free Plan. Do you want to upgrade to Business now?',
        });
        this.store$.dispatch(
          new NotificationsAction.Confirm({
            title,
            message,
            action: new RouterAction.Go({
              path: ['/organization', code, 'detail'],
              extras: {fragment: 'orderService'},
            }),
            yesFirst: false,
          })
        );
      });
  }

  public onEdit() {
    this.editableCellDirective.startEditing();
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

  public onMouseDown() {
    if (!this.edited) {
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

  public onEditKeyDown(event: KeyboardEvent) {
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

  public onKeyDown(event: KeyboardEvent) {
    event[EDITABLE_EVENT] = this.allowedPermissions && this.allowedPermissions.writeWithView;
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
