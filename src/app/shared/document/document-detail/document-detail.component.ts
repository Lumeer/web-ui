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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ConstraintData, DurationUnitsMap} from '../../../core/model/data/constraint';
import {NotificationService} from '../../../core/notifications/notification.service';
import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {convertQueryModelToString} from '../../../core/store/navigation/query/query.converter';
import {findAttribute, getDefaultAttributeId} from '../../../core/store/collections/collection.util';
import {Workspace} from '../../../core/store/navigation/workspace';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Query} from '../../../core/store/navigation/query/query';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {selectServiceLimitsByWorkspace} from '../../../core/store/organizations/service-limits/service-limits.state';
import {Perspective} from '../../../view/perspectives/perspective';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import {User} from '../../../core/store/users/user';
import {AppState} from '../../../core/store/app.state';
import {DialogService} from '../../../dialog/dialog.service';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {RouterAction} from '../../../core/store/router/router.action';

@Component({
  selector: 'document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissions;

  public users$: Observable<User[]>;
  public readonly durationUnitsMap: DurationUnitsMap;
  public workspace$: Observable<Workspace>;

  public defaultAttribute: Attribute;

  public constraintData$: Observable<ConstraintData>;

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspectiveService: PerspectiveService,
    private dialogService: DialogService,
    private constraintDataService: ConstraintDataService
  ) {
  }

  public ngOnInit() {
    this.constraintData$ = this.constraintDataService.observeConstraintData();
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.initDefaultAttribute();
    }
  }

  private initDefaultAttribute() {
    const defaultAttributeId = this.collection && getDefaultAttributeId(this.collection);
    this.defaultAttribute = defaultAttributeId && findAttribute(this.collection.attributes, defaultAttributeId);
  }

  public ngOnDestroy() {
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

  public fireConstraintConfig(id: string) {
    this.dialogService.openCollectionAttributeConfigDialog(this.collection.id, id);
  }

  public fireFunctionConfig(id: string, event: MouseEvent) {
    this.store$
      .pipe(
        select(selectServiceLimitsByWorkspace),
        map(serviceLimits => serviceLimits.functionsPerCollection),
        first()
      )
      .subscribe(functionsCountLimit => {
        const functions = this.collection.attributes.filter(
          attribute => attribute.id !== id && !!attribute.function && !!attribute.function.js
        ).length;
        if (functionsCountLimit !== 0 && functions >= functionsCountLimit) {
          this.notifyFunctionsLimit();
        } else {
          // the original event closes the dialog immediately when not stopped
          event.stopPropagation();
          this.dialogService.openCollectionAttributeFunction(this.collection.id, id);
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
}
