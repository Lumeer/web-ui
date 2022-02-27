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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ResourceActivityComponent} from './resource-activity.component';
import {AuditLogAutomationStringPipe} from './audit-logs/pipes/audit-log-automation-string.pipe';
import {AuditLogAutomationTitlePipe} from './audit-logs/pipes/audit-log-automation-title.pipe';
import {AuditLogComponent} from './audit-logs/log/audit-log.component';
import {AuditLogEntriesComponent} from './audit-logs/log/entries/audit-log-entries.component';
import {ResourceCommentsModule} from '../comments/resource-comments.module';
import {DataInputModule} from '../../data-input/data-input.module';
import {AuditLogsComponent} from './audit-logs/audit-logs.component';
import {PipesModule} from '../../pipes/pipes.module';
import {AuditLogParentPipe} from './audit-logs/pipes/audit-log-parent.pipe';
import {AuditLogRevertablePipe} from './audit-logs/pipes/audit-log-revertable.pipe';
import {AuditLogsFiltersComponent} from './audit-logs/filters/audit-logs-filters.component';
import {FilterAuditLogsPipe} from './audit-logs/pipes/filter-audit-logs.pipe';
import {SelectModule} from '../../select/select.module';

@NgModule({
  declarations: [
    AuditLogComponent,
    AuditLogsComponent,
    AuditLogEntriesComponent,
    ResourceActivityComponent,
    AuditLogAutomationStringPipe,
    AuditLogAutomationTitlePipe,
    AuditLogParentPipe,
    AuditLogRevertablePipe,
    FilterAuditLogsPipe,
    AuditLogsFiltersComponent,
  ],
  imports: [CommonModule, ResourceCommentsModule, PipesModule, TooltipModule, DataInputModule, SelectModule],
  exports: [ResourceActivityComponent],
})
export class ResourceActivityModule {}
