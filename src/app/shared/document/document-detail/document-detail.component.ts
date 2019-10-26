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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, TemplateRef} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ConstraintData, DurationUnitsMap} from '../../../core/model/data/constraint';
import {NotificationService} from '../../../core/notifications/notification.service';
import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Query} from '../../../core/store/navigation/query/query';
import {Perspective} from '../../../view/perspectives/perspective';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import {User} from '../../../core/store/users/user';
import {AppState} from '../../../core/store/app.state';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {ModalService} from '../../modal/modal.service';

@Component({
  selector: 'document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailComponent implements OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Output()
  public documentChanged = new EventEmitter<DocumentModel>();

  public users$: Observable<User[]>;
  public readonly durationUnitsMap: DurationUnitsMap;
  public workspace$: Observable<Workspace>;

  public constraintData$: Observable<ConstraintData>;

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspectiveService: PerspectiveService,
    private modalService: ModalService,
    private constraintDataService: ConstraintDataService
  ) {}

  public ngOnInit() {
    this.constraintData$ = this.constraintDataService.observeConstraintData();
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }

  public onRemoveDocument() {
    this.store$.dispatch(
      new DeleteConfirm({
        collectionId: this.document.collectionId,
        documentId: this.document.id,
      })
    );
  }

  public onSwitchToTable() {
    if (this.collection && this.document) {
      const queryString = convertQueryModelToString({stems: [{collectionId: this.collection.id}]});
      this.perspectiveService.switchPerspective(Perspective.Table, this.collection, this.document, queryString);
    }
  }

  public onAttributeTypeClick(attribute: Attribute) {
    this.modalService.showAttributeType(attribute.id, this.collection.id);
  }

  public onAttributeFunctionClick(attribute: Attribute) {
    this.modalService.showAttributeFunction(attribute.id, this.collection.id);
  }
}
