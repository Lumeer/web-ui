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

import {ConstraintData, SelectConstraintOption, SelectDataValue, UserDataValue} from '@lumeer/data-filters';

import {ResourceType} from '../../../../../core/model/resource-type';
import {AuditLogType} from '../../../../../core/store/audit-logs/audit-log.model';
import {Collection} from '../../../../../core/store/collections/collection';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {User} from '../../../../../core/store/users/user';
import {View} from '../../../../../core/store/views/view';
import {removeFromArray} from '../../../../utils/array.utils';
import {AuditLogConfiguration} from '../model/audit-log-configuration';
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

  @Input()
  public viewsMap: Record<string, View>;

  @Input()
  public collectionsMap: Record<string, Collection>;

  @Input()
  public linkTypesMap: Record<string, LinkType>;

  @Input()
  public configuration: AuditLogConfiguration;

  @Input()
  public resourceType: ResourceType;

  @Output()
  public filtersChanged = new EventEmitter<AuditLogFilters>();

  public usersDataValue: UserDataValue;
  public typesDataValue: SelectDataValue;

  public users: User[];
  public types: SelectConstraintOption[];
  public collections: Collection[];
  public linkTypes: LinkType[];
  public views: View[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.filters || changes.constraintData || changes.resourceType) {
      this.usersDataValue = auditLogUsersFilterConstraint.createDataValue(this.filters?.users, this.constraintData);
      this.users = this.usersDataValue.users;

      this.typesDataValue = auditLogTypeFilterConstraint(this.resourceType).createDataValue(
        this.filters?.types,
        this.constraintData
      );
      this.types = this.typesDataValue.options;
    }
    if (changes.filters || changes.collectionsMap) {
      this.collections = (this.filters?.collections || [])
        .map(id => this.collectionsMap?.[id])
        .filter(collection => !!collection);
    }
    if (changes.filters || changes.linkTypesMap) {
      this.linkTypes = (this.filters?.linkTypes || [])
        .map(id => this.linkTypesMap?.[id])
        .filter(linkType => !!linkType);
    }
    if (changes.filters || changes.viewsMap) {
      this.views = (this.filters?.views || []).map(id => this.viewsMap?.[id]).filter(view => !!view);
    }
  }

  public onUserRemove(value: string) {
    const users = removeFromArray(this.filters?.users, value);
    this.filtersChanged.emit({...this.filters, users});
  }

  public onTypeRemove(value: AuditLogType) {
    const types = removeFromArray(this.filters?.types, value);
    this.filtersChanged.emit({...this.filters, types});
  }

  public onCollectionRemove(value: string) {
    const collections = removeFromArray(this.filters?.collections, value);
    this.filtersChanged.emit({...this.filters, collections});
  }

  public onLinkTypeRemove(value: string) {
    const linkTypes = removeFromArray(this.filters?.linkTypes, value);
    this.filtersChanged.emit({...this.filters, linkTypes});
  }

  public onViewRemove(value: string) {
    const views = removeFromArray(this.filters?.views, value);
    this.filtersChanged.emit({...this.filters, views});
  }
}
