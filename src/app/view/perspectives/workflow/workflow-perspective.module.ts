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
import {RouterModule} from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';
import {WorkflowPerspectiveComponent} from './workflow-perspective.component';
import {WorkflowPerspectiveRoutingModule} from './workflow-perspective-routing.module';
import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {TableModule} from '../../../shared/table/table.module';
import {WorkflowTablesComponent} from './content/tables/workflow-tables.component';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {InputModule} from '../../../shared/input/input.module';
import {WorkflowToolbarComponent} from './content/tables/toolbar/workflow-toolbar.component';
import {SelectModule} from '../../../shared/select/select.module';
import {WorkflowSelectedItemPipe} from './pipes/workflow-selected-item.pipe';
import {FilterStemTablesPipe} from './pipes/filter-stem-tables.pipe';
import {ResizerDirective} from './content/tables/resizer.directive';
import {WorkflowContentComponent} from './content/workflow-content.component';
import {ResizableSidebarModule} from '../../../shared/resizable-sidebar/resizable-sidebar.module';
import {WorkflowSidebarComponent} from './content/sidebar/workflow-sidebar.component';
import {DataResourceModule} from '../../../shared/data-resource/data-resource.module';
import {SettingsModule} from '../../../shared/settings/settings.module';
import {LinksListModule} from '../../../shared/links/links-list/links-list.module';
import {WorkflowTablesIdsPipe} from './pipes/workflow-tables-ids.pipe';
import {WorkflowTableTitleComponent} from './content/tables/title/workflow-table-title.component';

@NgModule({
  declarations: [
    WorkflowPerspectiveComponent,
    WorkflowTablesComponent,
    WorkflowToolbarComponent,
    WorkflowSelectedItemPipe,
    FilterStemTablesPipe,
    ResizerDirective,
    WorkflowContentComponent,
    WorkflowSidebarComponent,
    WorkflowTablesIdsPipe,
    WorkflowTableTitleComponent,
  ],
  imports: [
    CommonModule,
    TableModule,
    RouterModule,
    WorkflowPerspectiveRoutingModule,
    DataInputModule,
    PipesModule,
    WarningMessageModule,
    InputModule,
    SelectModule,
    ResizableSidebarModule,
    DataResourceModule,
    SettingsModule,
    LinksListModule,
    MatMenuModule,
  ],
  providers: [ResizerDirective],
})
export class WorkflowPerspectiveModule {}
