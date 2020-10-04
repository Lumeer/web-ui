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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, ViewChild} from '@angular/core';
import {TableRow} from '../../../model/table-row';
import {TableColumn} from '../../../model/table-column';
import {isMacOS} from '../../../../utils/system.utils';
import {select, Store} from '@ngrx/store';
import {selectCollectionById} from '../../../../../core/store/collections/collections.state';
import {take, withLatestFrom} from 'rxjs/operators';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {AppState} from '../../../../../core/store/app.state';
import {ModalService} from '../../../../modal/modal.service';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../../../../core/store/link-instances/link-instances.state';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {ContextMenuComponent} from 'ngx-contextmenu';

@Component({
  selector: 'table-row-menu',
  templateUrl: './table-row-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowMenuComponent {
  @Input()
  public row: TableRow;

  @Input()
  public column: TableColumn;

  @Output()
  public edit = new EventEmitter();

  @ViewChild(ContextMenuComponent, {static: true})
  public contextMenu: ContextMenuComponent;

  public readonly macOS = isMacOS();

  public constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public onRemoveRow() {
    if (this.row.documentId && this.column.collectionId) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: this.column.collectionId,
          documentId: this.row.documentId,
        })
      );
    } else {
      // TODO
    }
  }

  public onDocumentDetail() {
    if (this.row.documentId && this.column.collectionId) {
      this.store$
        .pipe(
          select(selectCollectionById(this.column.collectionId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectDocumentById(this.row.documentId))))
        )
        .subscribe(([collection, document]) => this.modalService.showDataResourceDetail(document, collection));
    } else if (this.row.linkInstanceId && this.column.linkTypeId) {
      this.store$
        .pipe(
          select(selectLinkTypeById(this.column.linkTypeId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectLinkInstanceById(this.row.linkInstanceId))))
        )
        .subscribe(([linkType, linkInstance]) => this.modalService.showDataResourceDetail(linkInstance, linkType));
    }
  }
}
