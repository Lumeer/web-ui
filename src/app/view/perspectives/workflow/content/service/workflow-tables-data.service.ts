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

import {AppState} from '../../../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {TableColumn} from '../../../../../shared/table/model/table-column';
import {CollectionsAction} from '../../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../../core/store/link-types/link-types.action';
import {NotificationsAction} from '../../../../../core/store/notifications/notifications.action';
import {Injectable} from '@angular/core';
import {TableRow} from '../../../../../shared/table/model/table-row';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../../core/store/documents/documents.action';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../../../core/store/link-instances/link-instances.action';
import {selectCollectionById} from '../../../../../core/store/collections/collections.state';
import {take, withLatestFrom} from 'rxjs/operators';
import {selectDocumentById} from '../../../../../core/store/documents/documents.state';
import {selectLinkTypeById} from '../../../../../core/store/link-types/link-types.state';
import {selectLinkInstanceById} from '../../../../../core/store/link-instances/link-instances.state';

@Injectable()
export class WorkflowTablesDataService {
  constructor(private store$: Store<AppState>, private modalService: ModalService, private i18n: I18n) {}

  public removeRow(row: TableRow, column: TableColumn) {
    if (row.documentId && column.collectionId) {
      this.store$.dispatch(
        new DocumentsAction.DeleteConfirm({
          collectionId: column.collectionId,
          documentId: row.documentId,
        })
      );
    } else {
      // TODO
    }
  }

  public showRowDetail(row: TableRow, column: TableColumn) {
    if (row.documentId && column.collectionId) {
      this.store$
        .pipe(
          select(selectCollectionById(column.collectionId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectDocumentById(row.documentId))))
        )
        .subscribe(([collection, document]) => this.modalService.showDataResourceDetail(document, collection));
    } else if (row.linkInstanceId && column.linkTypeId) {
      this.store$
        .pipe(
          select(selectLinkTypeById(column.linkTypeId)),
          take(1),
          withLatestFrom(this.store$.pipe(select(selectLinkInstanceById(row.linkInstanceId))))
        )
        .subscribe(([linkType, linkInstance]) => this.modalService.showDataResourceDetail(linkInstance, linkType));
    }
  }

  public showAttributeType(column: TableColumn) {
    this.modalService.showAttributeType(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public showAttributeFunction(column: TableColumn) {
    this.modalService.showAttributeFunction(column.attribute.id, column.collectionId, column.linkTypeId);
  }

  public renameAttribute(column: TableColumn, name: string) {
    if (column?.collectionId) {
      this.store$.dispatch(
        new CollectionsAction.RenameAttribute({
          collectionId: column.collectionId,
          attributeId: column.attribute.id,
          name,
        })
      );
    } else if (column?.linkTypeId) {
      // TODO link
    }
  }

  public deleteAttribute(column: TableColumn) {
    const attributeId = column?.attribute?.id;
    let action: Action;
    if (attributeId && column.collectionId) {
      action = new CollectionsAction.RemoveAttribute({collectionId: column.collectionId, attributeId});
    } else if (column?.attribute?.id && column.linkTypeId) {
      action = new LinkTypesAction.DeleteAttribute({linkTypeId: column.linkTypeId, attributeId});
    }

    if (action) {
      const title = this.i18n({id: 'table.delete.column.dialog.title', value: 'Delete this column?'});
      const message = this.i18n({
        id: 'table.delete.column.dialog.message',
        value: 'Do you really want to delete the column? This will permanently remove the attribute and all its data.',
      });

      this.store$.dispatch(new NotificationsAction.Confirm({title, message, action, type: 'danger'}));
    }
  }

  public setDisplayedAttribute(column: TableColumn) {
    this.store$.dispatch(
      new CollectionsAction.SetDefaultAttribute({
        attributeId: column.attribute.id,
        collectionId: column.collectionId,
      })
    );
  }

  public saveRowNewValue(row: TableRow, column: TableColumn, value: any) {
    const patchData = {[column.attribute.id]: value};
    if (column.collectionId && row.documentId) {
      const document: DocumentModel = {
        id: row.documentId,
        collectionId: column.collectionId,
        data: patchData,
      };
      this.store$.dispatch(new DocumentsAction.PatchData({document}));
    } else if (column.linkTypeId && row.linkInstanceId) {
      const linkInstance: LinkInstance = {
        id: row.linkInstanceId,
        linkTypeId: column.linkTypeId,
        data: patchData,
        documentIds: ['', ''],
      };
      this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
    }
  }
}
