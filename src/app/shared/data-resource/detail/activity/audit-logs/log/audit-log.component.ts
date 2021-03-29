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
import {DataInputConfiguration} from '../../../../../data-input/data-input-configuration';
import {Constraint, ConstraintData, DataValue} from '@lumeer/data-filters';
import {AttributesResource} from '../../../../../../core/model/resource';
import {objectsByIdMap} from '../../../../../utils/common.utils';

interface ChangeEntry {
  label?: string;
  attributeId: string;
  dataValue: DataValue;
  constraint: Constraint;
}

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
  public allowRevert: boolean;

  @Input()
  public first: boolean;

  @Input()
  public last: boolean;

  @Output()
  public revert = new EventEmitter();

  public user: User;
  public entries: ChangeEntry[];

  public readonly updatedByMsg: string;
  public readonly updatedOnMsg: string;
  public readonly unknownUser: string;
  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};

  constructor() {
    this.unknownUser = $localize`:@@user.unknown:Unknown user`;
    this.updatedOnMsg = $localize`:@@document.detail.header.updatedOn:Updated on`;
    this.updatedByMsg = $localize`:@@document.detail.header.updatedBy:Updated by`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.auditLog || changes.usersMap) {
      this.user = this.usersMap?.[this.auditLog.userId];
    }
    if (changes.auditLog || changes.parent || changes.constraintData) {
      this.createEntries();
    }
    if (this.first) {
      this.auditLog = {...this.auditLog, automation: '=lalala'};
    }
    if (this.last) {
      this.auditLog = {...this.auditLog, automation: 'lalala'};
    }
  }

  private createEntries() {
    const attributesMap = objectsByIdMap(this.parent?.attributes);
    this.entries = Object.keys(this.auditLog.newState || {}).reduce<ChangeEntry[]>((array, attributeId) => {
      const attribute = attributesMap[attributeId];
      const value = this.auditLog.newState[attributeId];
      if (attribute) {
        array.push({
          attributeId,
          constraint: attribute.constraint,
          label: attribute.name,
          dataValue: attribute.constraint?.createDataValue(value, this.constraintData),
        });
      }

      return array;
    }, []);
  }
}
