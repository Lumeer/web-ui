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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import {
  AuditLogFilters,
  auditLogTypeFilterConstraint,
  auditLogUsersFilterConstraint,
} from '../../model/audit-log-filters';
import {ConstraintData, SelectDataValue, UserDataValue} from '@lumeer/data-filters';
import {DropdownDirective} from '../../../../../dropdown/dropdown.directive';
import {UserDataInputConfiguration} from '../../../../../data-input/data-input-configuration';
import {BehaviorSubject} from 'rxjs';
import {objectValues, preventEvent} from '../../../../../utils/common.utils';
import {Collection} from '../../../../../../core/store/collections/collection';
import {View} from '../../../../../../core/store/views/view';
import {LinkType} from '../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'audit-log-filters-dropdown',
  templateUrl: './audit-log-filters-dropdown.component.html',
  styleUrls: ['./audit-log-filters-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogFiltersDropdownComponent extends DropdownDirective {
  @Input()
  public filters: AuditLogFilters;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public viewsMap: Record<string, View>;

  @Input()
  public collectionsMap: Record<string, Collection>;

  @Input()
  public linkTypesMap: Record<string, LinkType>;

  @Output()
  public filtersChanged = new EventEmitter<AuditLogFilters>();

  public usersDataValue: UserDataValue;
  public userConfig: UserDataInputConfiguration = {onlyIcon: true};
  public typesDataValue: SelectDataValue;

  public editingUsers$ = new BehaviorSubject(false);
  public editingTypes$ = new BehaviorSubject(false);

  public views: View[];
  public collections: Collection[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.filters || changes.constraintData) {
      this.usersDataValue = auditLogUsersFilterConstraint.createDataValue(this.filters?.users, this.constraintData);
      this.typesDataValue = auditLogTypeFilterConstraint.createDataValue(this.filters?.types, this.constraintData);
    }
    if (changes.viewsMap) {
      this.views = objectValues(this.viewsMap);
    }
    if (changes.collectionsMap) {
      this.collections = objectValues(this.collectionsMap);
    }
  }

  public onSaveUsers(data: {dataValue: UserDataValue}) {
    this.patchFilters('users', data.dataValue.serialize());
    this.editingUsers$.next(false);
  }

  public onClickUsers(event: MouseEvent) {
    preventEvent(event);
    this.editingUsers$.next(true);
  }

  public onCancelUsers() {
    this.editingUsers$.next(false);
  }

  public onSaveTypes(data: {dataValue: SelectDataValue}) {
    this.patchFilters('types', data.dataValue.serialize());
    this.editingTypes$.next(false);
  }

  public onClickTypes(event: MouseEvent) {
    preventEvent(event);
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
