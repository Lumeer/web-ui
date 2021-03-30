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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ResourceType} from '../../../../core/model/resource-type';
import {AuditLog} from '../../../../core/store/audit-logs/audit-log.model';
import {Observable} from 'rxjs';
import {AppState} from '../../../../core/store/app.state';
import {selectAuditLogsByDocument, selectAuditLogsByLink} from '../../../../core/store/audit-logs/audit-logs.state';
import {Action, select, Store} from '@ngrx/store';
import * as AuditLogActions from '../../../../core/store/audit-logs/audit-logs.actions';
import {AttributesResource, DataResource} from '../../../../core/model/resource';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import {selectDocumentById} from '../../../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../../../core/store/link-instances/link-instances.state';

@Component({
  selector: 'resource-activity',
  templateUrl: './resource-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceActivityComponent implements OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resourceId: string;

  @Input()
  public parent: AttributesResource;

  public audit$: Observable<AuditLog[]>;
  public dataResource$: Observable<DataResource>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || changes.resourceId || changes.parent) {
      this.subscribeData();
    }
  }

  private subscribeData() {
    if (this.resourceType === ResourceType.Document) {
      this.dataResource$ = this.store$.pipe(select(selectDocumentById(this.resourceId)));
      this.audit$ = this.store$.pipe(select(selectAuditLogsByDocument(this.resourceId)));
      this.store$.dispatch(AuditLogActions.getByDocument({documentId: this.resourceId, collectionId: this.parent.id}));
    } else if (this.resourceType === ResourceType.Link) {
      this.dataResource$ = this.store$.pipe(select(selectLinkInstanceById(this.resourceId)));
      this.audit$ = this.store$.pipe(select(selectAuditLogsByLink(this.resourceId)));
      this.store$.dispatch(AuditLogActions.getByLink({linkInstanceId: this.resourceId, linkTypeId: this.parent.id}));
    }
  }

  public onRevertAudit(auditLog: AuditLog) {
    const action = this.revertAuditAction(auditLog);
    if (action) {
      const title = $localize`:@@audit.revert.confirm.title:Revert changes?`;
      const message = $localize`:@@audit.revert.confirm.message:Do you really want to revert the latest changes?`;

      this.store$.dispatch(new NotificationsAction.Confirm({title, message, type: 'info', action}));
    }
  }

  public revertAuditAction(auditLog: AuditLog): Action {
    if (this.resourceType === ResourceType.Document) {
      return AuditLogActions.revertDocument({
        documentId: this.resourceId,
        collectionId: this.parent.id,
        auditLogId: auditLog.id,
      });
    } else if (this.resourceType === ResourceType.Link) {
      return AuditLogActions.revertLink({
        linkInstanceId: this.resourceId,
        linkTypeId: this.parent.id,
        auditLogId: auditLog.id,
      });
    }
    return null;
  }
}
