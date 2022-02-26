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
import {ResourceType} from '../../../core/model/resource-type';
import {AuditLog, AuditLogType} from '../../../core/store/audit-logs/audit-log.model';
import {Observable, of, combineLatest} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {
  selectAuditLogsByCollection,
  selectAuditLogsByDocument,
  selectAuditLogsByLink,
  selectAuditLogsByLinkType,
  selectAuditLogsByProject,
} from '../../../core/store/audit-logs/audit-logs.state';
import {Action, select, Store} from '@ngrx/store';
import * as AuditLogActions from '../../../core/store/audit-logs/audit-logs.actions';
import {AttributesResource, DataResource} from '../../../core/model/resource';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AuditLogParentData} from './audit-logs/model/audit-log-parent-data';
import {selectCollectionById, selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {selectLinkTypeById, selectLinkTypesDictionary} from '../../../core/store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {generateId} from '../../utils/resource.utils';

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

  @Input()
  public workspace: Workspace;

  public audit$: Observable<AuditLog[]>;
  public parentData$: Observable<AuditLogParentData>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || changes.resourceId || changes.parent || changes.workspace) {
      this.subscribeData();
    }
  }

  private subscribeData() {
    if (this.resourceType === ResourceType.Document) {
      this.parentData$ = of({collectionsMap: {[this.parent?.id]: this.parent}});
      this.audit$ = combineLatest([
        this.store$.pipe(select(selectAuditLogsByDocument(this.resourceId))),
        this.store$.pipe(select(selectDocumentById(this.resourceId))),
      ]).pipe(map(([logs, document]) => this.appendCreatedLogsIfNeeded(logs, document)));
      this.store$.dispatch(
        AuditLogActions.getByDocument({
          documentId: this.resourceId,
          collectionId: this.parent.id,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Link) {
      this.parentData$ = of({linkTypesMap: {[this.parent?.id]: this.parent}});
      this.audit$ = combineLatest([
        this.store$.pipe(select(selectAuditLogsByLink(this.resourceId))),
        this.store$.pipe(select(selectLinkInstanceById(this.resourceId))),
      ]).pipe(map(([logs, linkInstance]) => this.appendCreatedLogsIfNeeded(logs, linkInstance)));
      this.store$.dispatch(
        AuditLogActions.getByLink({
          linkInstanceId: this.resourceId,
          linkTypeId: this.parent.id,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Project) {
      this.parentData$ = combineLatest([
        this.store$.pipe(select(selectCollectionsDictionary)),
        this.store$.pipe(select(selectLinkTypesDictionary)),
      ]).pipe(map(([collectionsMap, linkTypesMap]) => ({collectionsMap, linkTypesMap})));
      this.audit$ = this.store$.pipe(select(selectAuditLogsByProject(this.resourceId)));
      this.store$.dispatch(
        AuditLogActions.getByProject({
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Collection) {
      this.parentData$ = this.store$.pipe(
        select(selectCollectionById(this.resourceId)),
        map(collection => ({collectionsMap: {[collection.id]: collection}}))
      );
      this.audit$ = this.store$.pipe(select(selectAuditLogsByCollection(this.resourceId)));
      this.store$.dispatch(
        AuditLogActions.getByCollection({
          collectionId: this.resourceId,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.LinkType) {
      this.parentData$ = this.store$.pipe(
        select(selectLinkTypeById(this.resourceId)),
        map(linkType => ({linkTypesMap: {[linkType.id]: linkType}}))
      );

      this.audit$ = this.store$.pipe(select(selectAuditLogsByLinkType(this.resourceId)));
      this.store$.dispatch(
        AuditLogActions.getByLinkType({
          linkTypeId: this.resourceId,
          workspace: this.workspace,
        })
      );
    }
  }

  private appendCreatedLogsIfNeeded(logs: AuditLog[], dataResource: DataResource): AuditLog[] {
    const auditLogCreated = {
      type: AuditLogType.Created,
      changeDate: dataResource.creationDate,
      userId: dataResource.createdBy,
      id: generateId(),
    };

    return [...logs, auditLogCreated];
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
    if (auditLog.resourceType === ResourceType.Document) {
      return AuditLogActions.revertDocument({
        documentId: auditLog.resourceId,
        collectionId: auditLog.parentId,
        auditLogId: auditLog.id,
        workspace: this.workspace,
      });
    } else if (auditLog.resourceType === ResourceType.Link) {
      return AuditLogActions.revertLink({
        linkInstanceId: auditLog.resourceId,
        linkTypeId: auditLog.parentId,
        auditLogId: auditLog.id,
        workspace: this.workspace,
      });
    }
    return null;
  }
}
