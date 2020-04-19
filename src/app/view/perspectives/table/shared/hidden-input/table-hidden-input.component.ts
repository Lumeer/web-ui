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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Actions, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {combineLatest, of, Subscription} from 'rxjs';
import {filter, map, mergeMap, switchMap, take} from 'rxjs/operators';
import {TableBodyCursor} from '../../../../../core/store/tables/table-cursor';
import {TablesAction, TablesActionType} from '../../../../../core/store/tables/tables.action';
import {
  selectTableColumn,
  selectTableCursor,
  selectTablePart,
  selectTableRow,
} from '../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../shared/direction';
import {KeyCode} from '../../../../../shared/key-code';
import {CollectionPermissionsPipe} from '../../../../../shared/pipes/permissions/collection-permissions.pipe';
import {EDITABLE_EVENT} from '../../table-perspective.component';
import {AppState} from '../../../../../core/store/app.state';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {selectCollectionById} from '../../../../../core/store/collections/collections.state';
import {findAttribute, findAttributeConstraint} from '../../../../../core/store/collections/collection.util';
import {UnknownConstraint} from '../../../../../core/model/constraint/unknown.constraint';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {ClipboardService} from '../../../../../core/service/clipboard.service';
import {selectLinkInstanceById} from '../../../../../core/store/link-instances/link-instances.state';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {AttributesResource, DataResource} from '../../../../../core/model/resource';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'table-hidden-input',
  templateUrl: './table-hidden-input.component.html',
  styleUrls: ['./table-hidden-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHiddenInputComponent implements OnInit, OnDestroy {
  @Input()
  public canManageConfig: boolean;

  @Input()
  public tableId: string;

  @ViewChild('hiddenInput', {static: true})
  public hiddenInput: ElementRef<HTMLInputElement>;

  private subscriptions = new Subscription();

  private skipCompose = false;

  private constraintData: ConstraintData;

  constructor(
    private actions$: Actions,
    private collectionPermissions: CollectionPermissionsPipe,
    private store$: Store<AppState>,
    private clipboardService: ClipboardService
  ) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToTableCursorActions());
    this.subscriptions.add(
      this.store$.pipe(select(selectConstraintData)).subscribe(data => (this.constraintData = data))
    );
  }

  private subscribeToTableCursorActions(): Subscription {
    return this.actions$
      .pipe(
        ofType<TablesAction.SetCursor>(TablesActionType.SET_CURSOR),
        filter(action => !action.payload.cursor || action.payload.cursor.tableId === this.tableId)
      )
      .subscribe(action => {
        const element = this.hiddenInput.nativeElement;

        if (action.payload.cursor) {
          element.focus();
        } else {
          element.blur();
        }
      });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Dead') {
      this.skipCompose = true;
      return;
    }

    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.F2:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({}));
        return;
      case KeyCode.Backspace:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.EditSelectedCell({clear: true}));
        return;
      case KeyCode.Delete:
        event.preventDefault();
        event.stopPropagation();
        this.store$.dispatch(new TablesAction.RemoveSelectedCell());
        return;
      case KeyCode.ArrowDown:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
      case KeyCode.ArrowUp:
        if (event.altKey && event.shiftKey) {
          break;
        }
        event.preventDefault();
        return;
      case KeyCode.Tab:
        return;
      case KeyCode.KeyC:
        if (event.ctrlKey || event.metaKey) {
          this.copyCell();
          return;
        }
        break;
    }

    event.stopPropagation();

    this.onShortcutKeyDown(event);
  }

  private onShortcutKeyDown(event: KeyboardEvent) {
    this.store$
      .pipe(
        select(selectTableCursor),
        take(1),
        switchMap(cursor =>
          this.store$.pipe(
            select(selectTablePart(cursor)),
            take(1),
            filter(part => !!part),
            switchMap(part => this.collectionPermissions.transform({id: part.collectionId, name: null})),
            take(1),
            filter(() => !!cursor.rowPath),
            map(permissions => [cursor, permissions && permissions.writeWithView])
          )
        )
      )
      .subscribe(([cursor, writeWithView]: [TableBodyCursor, boolean]) => {
        event[EDITABLE_EVENT] = writeWithView;

        if (event.altKey && event.shiftKey && writeWithView && this.canManageConfig) {
          event.stopPropagation();
          switch (event.code) {
            case KeyCode.ArrowRight:
              this.store$.dispatch(new TablesAction.IndentRow({cursor}));
              return;
            case KeyCode.ArrowLeft:
              this.store$.dispatch(new TablesAction.OutdentRow({cursor}));
              return;
            case KeyCode.ArrowUp:
              this.store$.dispatch(new TablesAction.MoveRowUp({cursor}));
              this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
              return;
            case KeyCode.ArrowDown:
              this.store$.dispatch(new TablesAction.MoveRowDown({cursor}));
              this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
              return;
          }
        }
      });
  }

  public onInput(event: KeyboardEvent) {
    const element = event.target as HTMLInputElement;
    if ((event as any).isComposing && this.skipCompose) {
      this.skipCompose = false;
      return;
    }

    this.skipCompose = false;
    this.store$.dispatch(new TablesAction.EditSelectedCell({value: element.value}));
    element.value = '';
  }

  public onClick(event: MouseEvent) {
    event.preventDefault();
  }

  private copyCell() {
    this.store$
      .pipe(
        select(selectTableCursor),
        take(1),
        mergeMap(cursor =>
          combineLatest([
            this.store$.pipe(select(selectTablePart(cursor))),
            this.store$.pipe(select(selectTableRow(cursor))),
            this.store$.pipe(select(selectTableColumn(cursor))),
            of(cursor),
          ])
        ),
        take(1)
      )
      .subscribe(([tablePart, tableRow, tableColumn, tableCursor]) => {
        if (tableRow) {
          const column = tablePart.columns && tablePart.columns[tableCursor.columnIndex];
          const attributeId = column && column.attributeIds && column.attributeIds[0];
          if (attributeId) {
            if (tablePart.collectionId) {
              this.copyDocumentValue(tableRow.documentId, tablePart.collectionId, attributeId);
            } else if (tablePart.linkTypeId) {
              this.copyLinkValue(tableRow.linkInstanceId, tablePart.linkTypeId, attributeId);
            }
          }
        } else if (tableColumn) {
          const attributeId = tableColumn.attributeIds && tableColumn.attributeIds[0];
          if (tablePart.collectionId) {
            this.copyCollectionAttribute(tablePart.collectionId, attributeId);
          } else if (tablePart.linkTypeId) {
            this.copyLinkTypeAttribute(tablePart.linkTypeId, attributeId);
          }
        }
      });
  }

  private copyDocumentValue(documentId: string, collectionId: string, attributeId: string) {
    combineLatest([
      this.store$.pipe(select(selectDocumentById(documentId))),
      this.store$.pipe(select(selectCollectionById(collectionId))),
    ])
      .pipe(take(1))
      .subscribe(([document, collection]) => this.copyValue(document, collection, attributeId));
  }

  private copyLinkValue(linkInstanceId: string, linkTypeId: string, attributeId: string) {
    combineLatest([
      this.store$.pipe(select(selectLinkInstanceById(linkInstanceId))),
      this.store$.pipe(select(selectLinkTypeById(linkTypeId))),
    ])
      .pipe(take(1))
      .subscribe(([linkInstance, linkType]) => this.copyValue(linkInstance, linkType, attributeId));
  }

  private copyValue(dataResource: DataResource, attributesResource: AttributesResource, attributeId: string) {
    const constraint = findAttributeConstraint(attributesResource && attributesResource.attributes, attributeId);
    const value = (constraint || new UnknownConstraint())
      .createDataValue(dataResource.data[attributeId], this.constraintData)
      .editValue();
    this.clipboardService.copy(value);
  }

  private copyCollectionAttribute(collectionId: string, attributeId: string) {
    this.store$
      .pipe(select(selectCollectionById(collectionId)), take(1))
      .subscribe(collection => this.copyAttribute(collection, attributeId));
  }

  private copyLinkTypeAttribute(linkTypeId: string, attributeId: string) {
    this.store$
      .pipe(select(selectLinkTypeById(linkTypeId)), take(1))
      .subscribe(linkType => this.copyAttribute(linkType, attributeId));
  }

  private copyAttribute(attributesResource: AttributesResource, attributeId: string) {
    const attribute = findAttribute(attributesResource && attributesResource.attributes, attributeId);
    if (attribute) {
      this.clipboardService.copy(attribute.name);
    }
  }
}
