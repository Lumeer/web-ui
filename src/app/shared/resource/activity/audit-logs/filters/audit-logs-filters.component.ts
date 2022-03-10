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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {ConstraintData} from '@lumeer/data-filters';
import {AuditLogFilters} from '../model/audit-log-filters';
import {Collection} from '../../../../../core/store/collections/collection';
import {View} from '../../../../../core/store/views/view';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {AuditLogConfiguration} from '../model/audit-log-configuration';

@Component({
  selector: 'audit-logs-filters',
  templateUrl: './audit-logs-filters.component.html',
  styleUrls: ['./audit-logs-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogsFiltersComponent {
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

  @Output()
  public filtersChanged = new EventEmitter<AuditLogFilters>();
}
