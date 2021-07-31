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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {AuditLog, AuditLogType} from '../../../../../core/store/audit-logs/audit-log.model';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {User} from '../../../../../core/store/users/user';
import {Observable} from 'rxjs';
import {selectUsersDictionary} from '../../../../../core/store/users/users.state';
import {AttributesResource, DataResource} from '../../../../../core/model/resource';
import {ConstraintData} from '@lumeer/data-filters';
import {selectConstraintData} from '../../../../../core/store/constraint-data/constraint-data.state';
import {ServiceLimits} from '../../../../../core/store/organizations/service-limits/service.limits';
import {ServiceLevelType} from '../../../../../core/dto/service-level-type';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {selectOrganizationPermissions} from '../../../../../core/store/user-permissions/user-permissions.state';
import {selectServiceLimitsByWorkspace} from '../../../../../core/store/organizations/service-limits/service-limits.state';
import {selectOrganizationByWorkspace} from '../../../../../core/store/organizations/organizations.state';
import {first, map} from 'rxjs/operators';
import {RouterAction} from '../../../../../core/store/router/router.action';
import {generateId} from '../../../../utils/resource.utils';
import {selectRevertingAuditLogsIds} from '../../../../../core/store/audit-logs/audit-logs.state';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent implements OnInit, OnChanges {
  @Input()
  public auditLogs: AuditLog[];

  @Input()
  public dataResource: DataResource;

  @Input()
  public parent: AttributesResource;

  @Output()
  public revert = new EventEmitter<AuditLog>();

  public readonly serviceLevel = ServiceLevelType;

  public usersMap$: Observable<Record<string, User>>;
  public constraintData$: Observable<ConstraintData>;
  public organizationPermissions$: Observable<AllowedPermissions>;
  public serviceLimits$: Observable<ServiceLimits>;
  public revertingAuditLogs$: Observable<string[]>;

  public auditLogCreated: AuditLog;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.usersMap$ = this.store$.pipe(select(selectUsersDictionary));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.organizationPermissions$ = this.store$.pipe(select(selectOrganizationPermissions));
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
    this.revertingAuditLogs$ = this.store$.pipe(select(selectRevertingAuditLogsIds));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dataResource && this.dataResource) {
      this.createAuditLogForCreation();
    }
  }

  private createAuditLogForCreation() {
    this.auditLogCreated = {
      type: AuditLogType.Created,
      changeDate: this.dataResource.creationDate,
      userId: this.dataResource.createdBy,
      id: generateId(),
    };
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
        this.store$.dispatch(
          new RouterAction.Go({
            path: ['/o', code, 'detail'],
            extras: {fragment: 'orderService'},
          })
        );
      });
  }

  public onRevert(auditLog: AuditLog) {
    this.revert.emit(auditLog);
  }
}
