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

import {Store, select} from '@ngrx/store';

import {Observable, switchMap} from 'rxjs';
import {map, take} from 'rxjs/operators';

import {ResourceType} from '../../../../core/model/resource-type';
import {AppState} from '../../../../core/store/app.state';
import {AuditLog} from '../../../../core/store/audit-logs/audit-log.model';
import * as AuditLogsAction from '../../../../core/store/audit-logs/audit-logs.actions';
import {selectAuditLogsByUser, selectAuditLogsByUserLoading} from '../../../../core/store/audit-logs/audit-logs.state';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {ResourcesAction} from '../../../../core/store/resources/data-resources.action';
import {selectUserByWorkspace} from '../../../../core/store/users/users.state';
import {AuditLogConfiguration} from '../../../../shared/resource/activity/audit-logs/model/audit-log-configuration';

@Component({
  selector: 'user-activity',
  templateUrl: './user-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserActivityComponent implements OnChanges {
  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  public readonly resourceType = ResourceType.Project;
  public readonly configuration: AuditLogConfiguration = {
    allowRevert: true,
    objectDetail: true,
    filtersByResource: true,
  };

  public auditLog$: Observable<AuditLog[]>;
  public auditLogsLoading$: Observable<boolean>;

  public workspace: Workspace;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.organizationId || changes.projectId) {
      this.subscribeData();
    }
  }

  private subscribeData() {
    this.workspace = {organizationId: this.organizationId, projectId: this.projectId};

    const userId$ = this.store$.pipe(
      select(selectUserByWorkspace),
      map(user => user.id)
    );
    this.auditLog$ = userId$.pipe(
      switchMap(userId => this.store$.pipe(select(selectAuditLogsByUser(this.projectId, userId))))
    );
    this.auditLogsLoading$ = userId$.pipe(
      switchMap(userId => this.store$.pipe(select(selectAuditLogsByUserLoading(userId))))
    );

    if (this.projectId) {
      userId$.pipe(take(1)).subscribe(userId => {
        this.store$.dispatch(AuditLogsAction.getByUser({projectId: this.projectId, userId, workspace: this.workspace}));
      });

      this.store$.dispatch(new ResourcesAction.Get({organizationId: this.organizationId, projectId: this.projectId}));
    }
  }
}
