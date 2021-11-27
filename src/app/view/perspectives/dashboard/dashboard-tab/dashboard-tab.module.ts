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

import {SharedModule} from '../../../../shared/shared.module';
import {DashboardTabComponent} from './dashboard-tab.component';
import {DashboardTabContentComponent} from './content/dashboard-tab-content.component';
import {DashboardTabRowContentComponent} from './content/row/dashboard-tab-row-content.component';
import {DashboardTabCellContentComponent} from './content/row/cell/dashboard-tab-cell-content.component';
import {DashboardTabActionComponent} from './content/row/cell/action/dashboard-tab-action.component';
import {PerspectivePreviewComponent} from './content/row/perspective-preview/perspective-preview.component';
import {TablePerspectiveModule} from '../../table/table-perspective.module';
import {PivotPerspectiveModule} from '../../pivot/pivot-perspective.module';
import {GanttChartPerspectiveModule} from '../../gantt-chart/gantt-chart-perspective.module';
import {ChartPerspectiveModule} from '../../chart/chart-perspective.module';
import {CalendarPerspectiveModule} from '../../calendar/calendar-perspective.module';
import {KanbanPerspectiveModule} from '../../kanban/kanban-perspective.module';
import {WorkflowPerspectiveModule} from '../../workflow/workflow-perspective.module';
import {MapPerspectiveModule} from '../../map/map-perspective.module';
import {DetailPerspectiveModule} from '../../detail/detail-perspective.module';
import {SearchViewsModule} from '../search-views/search-views.module';
import {SearchTasksModule} from '../search-tasks/search-tasks.module';
import {SearchCollectionsModule} from '../search-collections/search-collections.module';
import {SearchAllModule} from '../search-all/search-all.module';
import {DashboardNotesComponent} from './content/row/notes/dashboard-notes.component';
import {QuillModule} from 'ngx-quill';
import {FormPerspectiveModule} from '../../form/form-perspective.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    TablePerspectiveModule,
    PivotPerspectiveModule,
    GanttChartPerspectiveModule,
    ChartPerspectiveModule,
    CalendarPerspectiveModule,
    KanbanPerspectiveModule,
    WorkflowPerspectiveModule,
    MapPerspectiveModule,
    DetailPerspectiveModule,
    SearchViewsModule,
    SearchTasksModule,
    SearchCollectionsModule,
    SearchAllModule,
    QuillModule,
    FormPerspectiveModule,
  ],
  declarations: [
    PerspectivePreviewComponent,
    DashboardTabComponent,
    DashboardTabContentComponent,
    DashboardTabRowContentComponent,
    DashboardTabCellContentComponent,
    DashboardTabActionComponent,
    DashboardNotesComponent,
  ],
  exports: [DashboardTabComponent, PerspectivePreviewComponent],
})
export class DashboardTabModule {}
