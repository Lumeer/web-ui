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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';
import {RouterModule} from '@angular/router';

import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {DataResourceModule} from '../../../shared/data-resource/data-resource.module';
import {DirectivesModule} from '../../../shared/directives/directives.module';
import {ResizerDirective} from '../../../shared/directives/resizer.directive';
import {InputModule} from '../../../shared/input/input.module';
import {LinksListModule} from '../../../shared/links/links-list/links-list.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {PresenterModule} from '../../../shared/presenter/presenter.module';
import {ResizableSidebarModule} from '../../../shared/resizable-sidebar/resizable-sidebar.module';
import {SelectModule} from '../../../shared/select/select.module';
import {SettingsModule} from '../../../shared/settings/settings.module';
import {TableModule} from '../../../shared/table/table.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {WorkflowSidebarComponent} from './content/sidebar/workflow-sidebar.component';
import {WorkflowTableTitleComponent} from './content/tables/title/workflow-table-title.component';
import {WorkflowToolbarComponent} from './content/tables/toolbar/workflow-toolbar.component';
import {WorkflowTablesComponent} from './content/tables/workflow-tables.component';
import {WorkflowContentComponent} from './content/workflow-content.component';
import {FilterStemFooterPipe} from './pipes/filter-stem-footer.pipe';
import {FilterStemTablesPipe} from './pipes/filter-stem-tables.pipe';
import {FilterUniqueStemsConfigsPipe} from './pipes/filter-unique-stems-configs.pipe';
import {WorkflowSelectedItemPipe} from './pipes/workflow-selected-item.pipe';
import {WorkflowTablesIdsPipe} from './pipes/workflow-tables-ids.pipe';
import {WorkflowPerspectiveRoutingModule} from './workflow-perspective-routing.module';
import {WorkflowPerspectiveComponent} from './workflow-perspective.component';

@NgModule({
  declarations: [
    WorkflowPerspectiveComponent,
    WorkflowTablesComponent,
    WorkflowToolbarComponent,
    WorkflowSelectedItemPipe,
    FilterStemTablesPipe,
    WorkflowContentComponent,
    WorkflowSidebarComponent,
    WorkflowTablesIdsPipe,
    WorkflowTableTitleComponent,
    FilterUniqueStemsConfigsPipe,
    FilterStemFooterPipe,
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
    DirectivesModule,
    ResizableSidebarModule,
    DataResourceModule,
    SettingsModule,
    LinksListModule,
    MatMenuModule,
    PresenterModule,
  ],
  providers: [ResizerDirective],
  exports: [WorkflowPerspectiveComponent],
})
export class WorkflowPerspectiveModule {}
