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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges} from '@angular/core';
import {ResourceType} from '../../../core/model/resource-type';
import {AuditLog, AuditLogType} from '../../../core/store/audit-logs/audit-log.model';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {
  selectAuditLogsByCollection,
  selectAuditLogsByCollectionLoading,
  selectAuditLogsByDocument,
  selectAuditLogsByDocumentLoading,
  selectAuditLogsByLink,
  selectAuditLogsByLinkLoading,
  selectAuditLogsByLinkType,
  selectAuditLogsByLinkTypeLoading,
  selectAuditLogsByProject,
  selectAuditLogsByProjectLoading,
} from '../../../core/store/audit-logs/audit-logs.state';
import {Action, select, Store} from '@ngrx/store';
import * as AuditLogActions from '../../../core/store/audit-logs/audit-logs.actions';
import {DataResource} from '../../../core/model/resource';
import {NotificationsAction} from '../../../core/store/notifications/notifications.action';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {map, skip} from 'rxjs/operators';
import {generateId} from '../../utils/resource.utils';
import {AuditLogConfiguration} from './audit-logs/model/audit-log-configuration';

@Component({
  selector: 'resource-activity',
  templateUrl: './resource-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceActivityComponent implements OnChanges, OnDestroy {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resourceId: string;

  @Input()
  public parentId: string;

  @Input()
  public workspace: Workspace;

  public audit$: Observable<AuditLog[]>;
  public loading$: Observable<boolean>;

  public configuration: AuditLogConfiguration;

  private subscription = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType) {
      this.configuration = this.createConfiguration();
    }
    if (changes.resourceType || changes.resourceId || changes.parentId || changes.workspace) {
      this.subscribeData();
      this.loadData(this.resourceId);
      this.scheduleLoadData();
    }
  }

  private createConfiguration(): AuditLogConfiguration {
    if ([ResourceType.Document, ResourceType.Link].includes(this.resourceType)) {
      return {allowRevert: true};
    } else {
      return {filtersByResource: true, objectDetail: true};
    }
  }

  private subscribeData() {
    if (this.resourceType === ResourceType.Document) {
      this.audit$ = combineLatest([
        this.store$.pipe(select(selectAuditLogsByDocument(this.resourceId))),
        this.store$.pipe(select(selectDocumentById(this.resourceId))),
      ]).pipe(map(([logs, document]) => this.appendCreatedLogsIfNeeded(logs, document)));
      this.loading$ = this.store$.pipe(select(selectAuditLogsByDocumentLoading(this.resourceId)));
    } else if (this.resourceType === ResourceType.Link) {
      this.audit$ = combineLatest([
        this.store$.pipe(select(selectAuditLogsByLink(this.resourceId))),
        this.store$.pipe(select(selectLinkInstanceById(this.resourceId))),
      ]).pipe(map(([logs, linkInstance]) => this.appendCreatedLogsIfNeeded(logs, linkInstance)));
      this.loading$ = this.store$.pipe(select(selectAuditLogsByLinkLoading(this.resourceId)));
    } else if (this.resourceType === ResourceType.Project) {
      this.audit$ = this.store$.pipe(select(selectAuditLogsByProject(this.resourceId)));
      this.loading$ = this.store$.pipe(select(selectAuditLogsByProjectLoading(this.resourceId)));
    } else if (this.resourceType === ResourceType.Collection) {
      this.audit$ = this.store$.pipe(select(selectAuditLogsByCollection(this.resourceId)));
      this.loading$ = this.store$.pipe(select(selectAuditLogsByCollectionLoading(this.resourceId)));
    } else if (this.resourceType === ResourceType.LinkType) {
      this.audit$ = this.store$.pipe(select(selectAuditLogsByLinkType(this.resourceId)));
      this.loading$ = this.store$.pipe(select(selectAuditLogsByLinkTypeLoading(this.resourceId)));
    }
  }

  private loadData(resourceId: string) {
    if (this.resourceType === ResourceType.Document) {
      this.store$.dispatch(
        AuditLogActions.getByDocument({
          documentId: resourceId,
          collectionId: this.parentId,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Link) {
      this.store$.dispatch(
        AuditLogActions.getByLink({
          linkInstanceId: resourceId,
          linkTypeId: this.parentId,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Project) {
      this.store$.dispatch(
        AuditLogActions.getByProject({
          projectId: resourceId,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.Collection) {
      this.store$.dispatch(
        AuditLogActions.getByCollection({
          collectionId: resourceId,
          workspace: this.workspace,
        })
      );
    } else if (this.resourceType === ResourceType.LinkType) {
      this.store$.dispatch(
        AuditLogActions.getByLinkType({
          linkTypeId: resourceId,
          workspace: this.workspace,
        })
      );
    }
  }

  private scheduleLoadData() {
    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    if (this.resourceType === ResourceType.Document) {
      this.subscription.add(
        this.store$
          .pipe(select(selectDocumentById(this.resourceId)), skip(1))
          .subscribe(document => this.loadData(document.id))
      );
    } else if (this.resourceType === ResourceType.Link) {
      this.subscription.add(
        this.store$
          .pipe(select(selectLinkInstanceById(this.resourceId)), skip(1))
          .subscribe(link => this.loadData(link.id))
      );
    }
  }

  private appendCreatedLogsIfNeeded(logs: AuditLog[], dataResource: DataResource): AuditLog[] {
    if (logs.some(log => log.type === AuditLogType.Created)) {
      return logs;
    }
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
    return AuditLogActions.revert({
      auditLogId: auditLog.id,
      workspace: this.workspace,
    });
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
