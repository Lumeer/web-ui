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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AuditLog} from '../../../../core/store/audit-logs/audit-log.model';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
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
import {AuditLogParentData} from './model/audit-log-parent-data';
import {AuditLogFilters} from './model/audit-log-filters';
import {View} from '../../../../core/store/views/view';
import {selectViewsDictionary} from '../../../../core/store/views/views.state';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../core/store/collections/collections.state';

@Component({
  selector: 'audit-logs',
  templateUrl: './audit-logs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsComponent implements OnInit {
  @Input()
  public auditLogs: AuditLog[];

  @Input()
  public parentData: AuditLogParentData;

  @Output()
  public revert = new EventEmitter<AuditLog>();

  public readonly serviceLevel = ServiceLevelType;

  public usersMap$: Observable<Record<string, User>>;
  public constraintData$: Observable<ConstraintData>;
  public organizationPermissions$: Observable<AllowedPermissions>;
  public serviceLimits$: Observable<ServiceLimits>;
  public revertingAuditLogs$: Observable<string[]>;
  public viewsMap$: Observable<Record<string, View>>;
  public collectionsMap$: Observable<Record<string, Collection>>;

  public filters$ = new BehaviorSubject<AuditLogFilters>({users: [], types: []});

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.usersMap$ = this.store$.pipe(select(selectUsersDictionary));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.organizationPermissions$ = this.store$.pipe(select(selectOrganizationPermissions));
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
    this.revertingAuditLogs$ = this.store$.pipe(select(selectRevertingAuditLogsIds));
    this.viewsMap$ = this.store$.pipe(select(selectViewsDictionary));
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
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

  public onRevert(auditLog: AuditLog) {
    this.revert.emit(auditLog);
  }

  public onFiltersChanged(filters: AuditLogFilters) {
    this.filters$.next(filters);
  }
}
