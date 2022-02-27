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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ConstraintData, SelectDataValue, UserDataValue} from '@lumeer/data-filters';
import {AuditLogFilters, auditLogTypeFilterConstraint, auditLogUsersFilterConstraint} from '../model/audit-log-filters';

@Component({
  selector: 'audit-logs-filters',
  templateUrl: './audit-logs-filters.component.html',
  styleUrls: ['./audit-logs-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsFiltersComponent implements OnChanges {
  @Input()
  public filters: AuditLogFilters;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public filtersChanged = new EventEmitter<AuditLogFilters>();

  public usersDataValue: UserDataValue;
  public typesDataValue: SelectDataValue;

  public editingUsers$ = new BehaviorSubject(false);
  public editingTypes$ = new BehaviorSubject(false);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.filters || changes.constraintData) {
      this.usersDataValue = auditLogUsersFilterConstraint.createDataValue(this.filters?.users, this.constraintData);
      this.typesDataValue = auditLogTypeFilterConstraint.createDataValue(this.filters?.types, this.constraintData);
    }
  }

  public onSaveUsers(data: {dataValue: UserDataValue}) {
    this.patchFilters('users', data.dataValue.serialize());
    this.editingUsers$.next(false);
  }

  public onClickUsers() {
    this.editingUsers$.next(true);
  }

  public onCancelUsers() {
    this.editingUsers$.next(false);
  }

  public onSaveTypes(data: {dataValue: SelectDataValue}) {
    this.patchFilters('types', data.dataValue.serialize());
    this.editingTypes$.next(false);
  }

  public onClickTypes() {
    this.editingTypes$.next(true);
  }

  public onCancelTypes() {
    this.editingTypes$.next(false);
  }

  private patchFilters(key: keyof AuditLogFilters, value: any) {
    const filtersCopy = {...this.filters};
    filtersCopy[key] = value;
    this.filtersChanged.emit(filtersCopy);
  }
}
