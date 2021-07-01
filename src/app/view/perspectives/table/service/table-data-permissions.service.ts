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

import {Injectable} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {selectTablePart, selectTableRow} from '../../../../core/store/tables/tables.selector';
import {AppState} from '../../../../core/store/app.state';
import {TableCursor} from '../../../../core/store/tables/table-cursor';
import {DataResourcePermissions} from '../../../../core/model/data-resource-permissions';
import {selectDocumentById} from '../../../../core/store/documents/documents.state';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../../../core/store/user-permissions/user-permissions.state';
import {selectCurrentUserForWorkspace} from '../../../../core/store/users/users.state';
import {dataResourcePermissions} from '../../../../shared/utils/permission.utils';
import {selectLinkInstanceById} from '../../../../core/store/link-instances/link-instances.state';
import {selectLinkTypeById} from '../../../../core/store/link-types/link-types.state';

@Injectable()
export class TableDataPermissionsService {
  constructor(private store$: Store<AppState>) {}

  public selectDataPermissions$(cursor: TableCursor): Observable<DataResourcePermissions> {
    return combineLatest([
      this.store$.pipe(select(selectTableRow(cursor))),
      this.store$.pipe(select(selectTablePart(cursor))),
    ]).pipe(
      take(1),
      switchMap(([tableRow, tablePart]) => {
        if (tableRow) {
          if (tablePart?.collectionId) {
            return this.selectDocumentPermissions$(tableRow.documentId, tablePart.collectionId);
          } else if (tablePart?.linkTypeId) {
            return this.selectLinkPermissions$(tableRow.linkInstanceId, tablePart.linkTypeId);
          }
        }
        return of({});
      })
    );
  }

  private selectDocumentPermissions$(documentId: string, collectionId: string): Observable<DataResourcePermissions> {
    return combineLatest([
      this.store$.pipe(select(selectDocumentById(documentId))),
      this.store$.pipe(select(selectCollectionById(collectionId))),
      this.store$.pipe(select(selectCollectionPermissions(collectionId))),
      this.store$.pipe(select(selectCurrentUserForWorkspace)),
    ]).pipe(
      take(1),
      map(([document, collection, permissions, user]) =>
        dataResourcePermissions(document, collection, permissions, user)
      )
    );
  }

  private selectLinkPermissions$(linkInstance: string, linkType: string): Observable<DataResourcePermissions> {
    return combineLatest([
      this.store$.pipe(select(selectLinkInstanceById(linkInstance))),
      this.store$.pipe(select(selectLinkTypeById(linkType))),
      this.store$.pipe(select(selectLinkTypePermissions(linkType))),
      this.store$.pipe(select(selectCurrentUserForWorkspace)),
    ]).pipe(
      take(1),
      map(([linkInstance, linkType, permissions, user]) =>
        dataResourcePermissions(linkInstance, linkType, permissions, user)
      )
    );
  }
}
