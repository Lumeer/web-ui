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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {AuditLog} from '../../../../../../core/store/audit-logs/audit-log.model';
import {User} from '../../../../../../core/store/users/user';
import {ConstraintData} from '@lumeer/data-filters';
import {AttributesResource} from '../../../../../../core/model/resource';
import {DEFAULT_USER} from '../../../../../../core/constants';

@Component({
  selector: 'audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogComponent implements OnChanges {
  @Input()
  public auditLog: AuditLog;

  @Input()
  public parent: AttributesResource;

  @Input()
  public usersMap: Record<string, User>;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public reverting: boolean;

  @Input()
  public allowRevert: boolean;

  @Input()
  public first: boolean;

  @Input()
  public last: boolean;

  @Output()
  public revert = new EventEmitter();

  public user: User;

  public readonly updatedByMsg: string;
  public readonly updatedOnMsg: string;
  public readonly unknownUser: string;
  public readonly unknownUserEmail = DEFAULT_USER;

  public hasNewState: boolean;
  public hasOldState: boolean;

  constructor() {
    this.unknownUser = $localize`:@@user.unknown:Unknown user`;
    this.updatedOnMsg = $localize`:@@document.detail.header.updatedOn:Updated on`;
    this.updatedByMsg = $localize`:@@document.detail.header.updatedBy:Updated by`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.auditLog || changes.usersMap) {
      this.user = this.usersMap?.[this.auditLog.userId];
      this.hasNewState = Object.keys(this.auditLog?.newState || {}).length > 0;
      this.hasOldState = Object.keys(this.auditLog?.oldState || {}).length > 0;
    }
  }
}
