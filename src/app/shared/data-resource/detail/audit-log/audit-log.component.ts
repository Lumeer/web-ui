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
import {select, Store} from '@ngrx/store';
import * as AuditLogActions from '../../../../core/store/audit-logs/audit-logs.actions';

@Component({
  selector: 'audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent implements OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resourceId: string;

  @Input()
  public parentId: string;

  public audit$: Observable<AuditLog[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || changes.resourceId) {
      this.subscribeData();
    }
  }

  private subscribeData() {
    if (this.resourceType === ResourceType.Document) {
      this.audit$ = this.store$.pipe(select(selectAuditLogsByDocument(this.resourceId)));
      this.store$.dispatch(AuditLogActions.getByDocument({documentId: this.resourceId, collectionId: this.parentId}));
    } else if (this.resourceType === ResourceType.Link) {
      this.audit$ = this.store$.pipe(select(selectAuditLogsByLink(this.resourceId)));
      this.store$.dispatch(AuditLogActions.getByLink({linkTypeId: this.resourceId, linkInstanceId: this.parentId}));
    }
  }
}
