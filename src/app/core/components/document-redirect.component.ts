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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../store/app.state';
import {DocumentService} from '../data-service';
import {DocumentModel} from '../store/documents/document.model';
import {NotificationsAction} from '../store/notifications/notifications.action';
import {selectCollectionById} from '../store/collections/collections.state';
import {selectViewsDictionaryByCode} from '../store/views/views.state';
import {selectCollectionsPermissions, selectViewsPermissions} from '../store/user-permissions/user-permissions.state';
import {ModalService} from '../../shared/modal/modal.service';
import {convertQueryModelToString} from '../store/navigation/query/query.converter';
import {Perspective} from '../../view/perspectives/perspective';
import {QueryParam} from '../store/navigation/query-param';
import {convertViewCursorToString, ViewCursor} from '../store/navigation/view-cursor/view-cursor';
import {getDefaultAttributeId} from '../store/collections/collection.util';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentRedirectComponent implements OnInit {
  constructor(
    private documentService: DocumentService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store$: Store<AppState>,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.pipe(take(1)).subscribe(params => {
      const organizationCode = params.get('organizationCode');
      const projectCode = params.get('projectCode');
      const collectionId = params.get('collectionId');
      const documentId = params.get('documentId');
      this.documentService
        .getDocument(collectionId, documentId)
        .pipe(catchError(() => of(null)))
        .subscribe(document => {
          if (document) {
            this.handleDocument(organizationCode, projectCode, document);
          } else {
            const message = $localize`:@@notification.document.notVisible:I am sorry, this record could not be found.`;
            this.redirectToHomeWithError(message);
          }
        });
    });
  }

  private handleDocument(organizationCode: string, projectCode: string, document: DocumentModel) {
    combineLatest([
      this.store$.pipe(select(selectCollectionById(document.collectionId))),
      this.store$.pipe(select(selectViewsDictionaryByCode)),
      this.store$.pipe(select(selectViewsPermissions)),
      this.store$.pipe(select(selectCollectionsPermissions)),
    ])
      .pipe(take(1))
      .subscribe(([collection, viewsMap, viewsPermissions, collectionsPermissions]) => {
        let query: string;
        const path: any[] = ['w', organizationCode, projectCode, 'view'];
        const defaultView = viewsMap[collection?.purpose?.metaData?.defaultViewCode];
        if (defaultView && viewsPermissions[defaultView.id]?.read) {
          query = '';
          path.push({vc: defaultView.code});
        } else if (collection && collectionsPermissions[collection.id]?.read) {
          query = convertQueryModelToString({stems: [{collectionId: document.collectionId}]});
          path.push(Perspective.Workflow);
        } else if (collection) {
          this.redirectToHome(() => setTimeout(() => this.modalService.showDocumentDetail(document.id), 1000));
          return;
        } else {
          const message = $localize`:@@notification.document.notVisible:I am sorry, this record could not be found.`;
          this.redirectToHomeWithError(message);
          return;
        }

        const cursor: ViewCursor = {
          documentId: document.id,
          collectionId: document.collectionId,
          attributeId: getDefaultAttributeId(collection),
          sidebar: true,
        };
        const cursorString = convertViewCursorToString(cursor);
        this.router.navigate(path, {queryParams: {[QueryParam.Query]: query, [QueryParam.ViewCursor]: cursorString}});
      });
  }

  private redirectToHome(then?: () => void) {
    this.router.navigate(['/']).then(() => then?.());
  }

  private redirectToHomeWithError(message: string) {
    this.redirectToHome(() => setTimeout(() => this.store$.dispatch(new NotificationsAction.Error({message})), 1000));
  }
}
