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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {AuditLog} from '../../../../core/store/audit-logs/audit-log.model';
import {AppState} from '../../../../core/store/app.state';
import {Action, select, Store} from '@ngrx/store';
import {User} from '../../../../core/store/users/user';
import {BehaviorSubject, Observable} from 'rxjs';
import {selectUsersDictionary} from '../../../../core/store/users/users.state';
import {ConstraintData} from '@lumeer/data-filters';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {ServiceLimits} from '../../../../core/store/organizations/service-limits/service.limits';
import {ServiceLevelType} from '../../../../core/dto/service-level-type';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {selectOrganizationPermissions} from '../../../../core/store/user-permissions/user-permissions.state';
import {selectServiceLimitsByWorkspace} from '../../../../core/store/organizations/service-limits/service-limits.state';
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';
import {first, map} from 'rxjs/operators';
import {selectRevertingAuditLogsIds} from '../../../../core/store/audit-logs/audit-logs.state';
import {OrganizationsAction} from '../../../../core/store/organizations/organizations.action';
import {AuditLogFilters} from './model/audit-log-filters';
import {View} from '../../../../core/store/views/view';
import {selectViewsWithComputedData} from '../../../../core/store/views/views.state';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {selectLinkTypesWithCollections} from '../../../../core/store/link-types/link-types.state';
import {objectsByIdMap} from '../../../utils/common.utils';
import {AuditLogConfiguration} from './model/audit-log-configuration';
import {ModalService} from '../../../modal/modal.service';
import {ResourceType} from '../../../../core/model/resource-type';
import {NotificationsAction} from '../../../../core/store/notifications/notifications.action';
import * as AuditLogActions from '../../../../core/store/audit-logs/audit-logs.actions';
import {Workspace} from '../../../../core/store/navigation/workspace';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent implements OnInit {
  @Input()
  public auditLogs: AuditLog[];

  @Input()
  public loading: boolean;

  @Input()
  public configuration: AuditLogConfiguration;

  @Input()
  public resourceType: ResourceType;

  @Input()
  public workspace: Workspace;

  public readonly serviceLevel = ServiceLevelType;

  public usersMap$: Observable<Record<string, User>>;
  public constraintData$: Observable<ConstraintData>;
  public organizationPermissions$: Observable<AllowedPermissions>;
  public serviceLimits$: Observable<ServiceLimits>;
  public revertingAuditLogs$: Observable<string[]>;
  public viewsMap$: Observable<Record<string, View>>;
  public collectionsMap$: Observable<Record<string, Collection>>;
  public linkTypesMap$: Observable<Record<string, LinkType>>;

  public filters$ = new BehaviorSubject<AuditLogFilters>({users: [], types: []});

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public ngOnInit() {
    this.usersMap$ = this.store$.pipe(select(selectUsersDictionary));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.organizationPermissions$ = this.store$.pipe(select(selectOrganizationPermissions));
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
    this.revertingAuditLogs$ = this.store$.pipe(select(selectRevertingAuditLogsIds));
    this.viewsMap$ = this.store$.pipe(
      select(selectViewsWithComputedData),
      map(linkTypes => objectsByIdMap(linkTypes))
    );
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
    this.linkTypesMap$ = this.store$.pipe(
      select(selectLinkTypesWithCollections),
      map(linkTypes => objectsByIdMap(linkTypes))
    );
  }

  public trackByAudit(index: number, log: AuditLog): string {
    return log.id;
  }

  public openServiceOrder() {
    this.store$
      .pipe(
        select(selectOrganizationByWorkspace),
        map(organization => organization.code),
        first()
      )
      .subscribe(code => {
        this.store$.dispatch(new OrganizationsAction.GoToPayment({code}));
      });
  }

  public onDetail(auditLog: AuditLog) {
    if (auditLog.resourceType === ResourceType.Document) {
      this.modalService.showDocumentDetail(auditLog.resourceId, auditLog.parentId);
    } else if (auditLog.resourceType === ResourceType.Link) {
      this.modalService.showLinkInstanceDetail(auditLog.resourceId, auditLog.parentId);
    }
  }

  public onFiltersChanged(filters: AuditLogFilters) {
    this.filters$.next(filters);
  }

  public onRevert(auditLog: AuditLog) {
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
}
