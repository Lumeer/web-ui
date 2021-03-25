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
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {first, map, switchMap, take, tap} from 'rxjs/operators';
import {isMacOS} from '../../../../../../../../shared/utils/system.utils';
import {AllowedPermissions} from '../../../../../../../../core/model/allowed-permissions';
import {AppState} from '../../../../../../../../core/store/app.state';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../../../../core/store/documents/documents.action';
import {selectDocumentsDictionary} from '../../../../../../../../core/store/documents/documents.state';
import {LinkInstance} from '../../../../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../../../../core/store/link-instances/link-instances.action';
import {getTableRowCursor, TableBodyCursor} from '../../../../../../../../core/store/tables/table-cursor';
import {TableConfigPart, TableConfigRow} from '../../../../../../../../core/store/tables/table.model';
import {createEmptyTableRow} from '../../../../../../../../core/store/tables/table.utils';
import {TablesAction} from '../../../../../../../../core/store/tables/tables.action';
import {
  selectTableParts,
  selectTableRow,
  selectTableRowIndentable,
  selectTableRowOutdentable,
} from '../../../../../../../../core/store/tables/tables.selector';
import {Direction} from '../../../../../../../../shared/direction';
import {selectCollectionById} from '../../../../../../../../core/store/collections/collections.state';
import {ModalService} from '../../../../../../../../shared/modal/modal.service';
import {selectLinkTypeById} from '../../../../../../../../core/store/link-types/link-types.state';
import {MatMenuTrigger} from '@angular/material/menu';
import {CanCreateLinksPipe} from '../../../../../../../../shared/pipes/can-create-links.pipe';
import {selectCollectionsPermissions} from '../../../../../../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'table-data-cell-menu',
  templateUrl: './table-data-cell-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableDataCellMenuComponent implements OnChanges {
  @Input()
  public cursor: TableBodyCursor;

  @Input()
  public document: DocumentModel;

  @Input()
  public linkInstance: LinkInstance;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Output()
  public edit = new EventEmitter();

  @ViewChild(MatMenuTrigger)
  public contextMenu: MatMenuTrigger;

  public readonly macOS = isMacOS();

  public created: boolean;
  public contextMenuPosition = {x: 0, y: 0};

  public indentable$: Observable<boolean>;
  public outdentable$: Observable<boolean>;
  public setLinks$: Observable<boolean>;
  public tableRow$: Observable<TableConfigRow>;
  public tableParts$: Observable<TableConfigPart[]>;

  private tableParts: TableConfigPart[];

  public constructor(
    private store$: Store<AppState>,
    private modalService: ModalService,
    private canCreateLinksPipe: CanCreateLinksPipe
  ) {}

  public open(x: number, y: number) {
    this.contextMenuPosition = {x, y};
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document && this.document) {
      this.created = !!this.document.id;
    }
    if (changes.linkInstance && this.linkInstance) {
      this.created = !!this.linkInstance.id;
    }
    if (changes.cursor && this.cursor) {
      this.indentable$ = this.store$.select(selectTableRowIndentable(this.cursor));
      this.outdentable$ = this.store$.select(selectTableRowOutdentable(this.cursor));
      this.tableRow$ = this.store$.pipe(select(selectTableRow(this.cursor)));
      this.tableParts$ = this.store$.pipe(
        select(selectTableParts(this.cursor)),
        tap(parts => (this.tableParts = parts))
      );
      this.setLinks$ = this.bindSetLinks$();
    }
  }

  private bindSetLinks$(): Observable<boolean> {
    if (this.created && this.cursor.partIndex % 2 === 0) {
      return this.tableParts$.pipe(
        switchMap(parts => {
          const linkPart = parts[this.cursor.partIndex + 1];
          if (linkPart?.linkTypeId) {
            return combineLatest([
              this.store$.pipe(select(selectLinkTypeById(linkPart.linkTypeId))),
              this.store$.pipe(select(selectCollectionsPermissions)),
            ]).pipe(map(([linkType, permissions]) => this.canCreateLinksPipe.transform(linkType, permissions)));
          }
          return of(false);
        })
      );
    }
    return of(false);
  }

  public onAddRow(indexDelta: number) {
    if (this.cursor.partIndex === 0) {
      this.addPrimaryRow(indexDelta);
    } else {
      this.addLinkedRow(indexDelta);
    }

    if (indexDelta > 0) {
      this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
    } else {
      this.store$.dispatch(new TablesAction.SetCursor({cursor: this.cursor}));
    }
  }

  private addPrimaryRow(indexDelta: number) {
    combineLatest([
      this.store$.pipe(select(selectTableRow(this.cursor))),
      this.store$.pipe(select(selectTableRow(getTableRowCursor(this.cursor, 1)))),
      this.store$.pipe(select(selectDocumentsDictionary)),
    ])
      .pipe(first())
      .subscribe(([row, nextRow, documentsMap]) => {
        const parentDocumentId = this.getParentDocumentId(row, nextRow, Boolean(indexDelta), documentsMap);

        this.store$.dispatch(
          new TablesAction.AddPrimaryRows({
            cursor: getTableRowCursor(this.cursor, indexDelta),
            rows: [createEmptyTableRow(parentDocumentId)],
          })
        );
      });
  }

  private getParentDocumentId(
    row: TableConfigRow,
    nextRow: TableConfigRow,
    below: boolean,
    documentsMap: Record<string, DocumentModel>
  ): string {
    const nextRowDocument = documentsMap[nextRow && nextRow.documentId];
    const nextRowParentDocumentId =
      (nextRowDocument && nextRowDocument.metaData && nextRowDocument.metaData.parentId) ||
      (nextRow && nextRow.parentDocumentId);

    if (below && row && row.documentId === nextRowParentDocumentId) {
      return nextRowParentDocumentId;
    } else {
      const document = documentsMap[row && row.documentId];
      return (document && document.metaData && document.metaData.parentId) || (row && row.parentDocumentId);
    }
  }

  private addLinkedRow(indexDelta: number) {
    this.store$.dispatch(
      new TablesAction.AddLinkedRows({
        cursor: getTableRowCursor(this.cursor, indexDelta),
        linkedRows: [createEmptyTableRow()],
      })
    );
  }

  public onRemoveRow() {
    if (!this.document) {
      return;
    }

    const removeRowAction = new TablesAction.RemoveRow({cursor: this.cursor});
    if (this.document.id) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: this.document.collectionId,
          documentId: this.document.id,
          nextAction: removeRowAction,
        })
      );
    } else {
      this.store$.dispatch(removeRowAction);
    }
  }

  public onUnlinkRow() {
    this.store$
      .pipe(
        select(selectTableRow(this.cursor)),
        take(1),
        map(row => row.linkInstanceId)
      )
      .subscribe(linkInstanceId => {
        const nextAction = new TablesAction.RemoveRow({cursor: this.cursor});
        this.store$.dispatch(new LinkInstancesAction.DeleteConfirm({linkInstanceId, nextAction}));
      });
  }

  public onMoveUp() {
    this.store$.dispatch(new TablesAction.MoveRowUp({cursor: this.cursor}));
    this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Up}));
  }

  public onMoveDown() {
    this.store$.dispatch(new TablesAction.MoveRowDown({cursor: this.cursor}));
    this.store$.dispatch(new TablesAction.MoveCursor({direction: Direction.Down}));
  }

  public onIndent() {
    this.store$.dispatch(new TablesAction.IndentRow({cursor: this.cursor}));
  }

  public onOutdent() {
    this.store$.dispatch(new TablesAction.OutdentRow({cursor: this.cursor}));
  }

  public onCloneRow() {
    this.store$.dispatch(new TablesAction.CloneRow({cursor: this.cursor}));
  }

  public onDocumentDetail() {
    if (this.document) {
      this.store$
        .pipe(select(selectCollectionById(this.document.collectionId)), take(1))
        .subscribe(collection => this.modalService.showDataResourceDetail(this.document, collection));
    } else if (this.linkInstance) {
      this.store$
        .pipe(select(selectLinkTypeById(this.linkInstance.linkTypeId)), take(1))
        .subscribe(linkType => this.modalService.showDataResourceDetail(this.linkInstance, linkType));
    }
  }

  public onClick(event: MouseEvent) {
    this.contextMenu?.closeMenu();
    event.stopPropagation();
  }

  public onCopyValue() {
    this.store$.dispatch(new TablesAction.CopyValue({cursor: this.cursor}));
  }

  public onUpdateLinks() {
    const linkTypeId = this.tableParts?.[this.cursor.partIndex + 1]?.linkTypeId;
    if (this.document && linkTypeId) {
      this.modalService.showModifyDocumentLinks(this.document.id, this.document.collectionId, linkTypeId);
    }
  }
}
