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
import {RouterModule} from '@angular/router';
import {SharedModule} from '../../../shared/shared.module';
import {GanttChartPerspectiveRoutingModule} from './gantt-chart-perspective-routing.module';
import {GanttChartPerspectiveComponent} from './gantt-chart-perspective.component';
import {GanttChartConfigComponent} from './config/gantt-chart-config.component';
import {PickerModule} from '../../../shared/picker/picker.module';
import {GanttChartVisualizationComponent} from './tasks/visualization/gantt-chart-visualization.component';
import {GanttChartPipesModule} from './pipes/gantt-chart-pipes.module';
import {GanttChartStemConfigComponent} from './config/stem/gantt-chart-stem-config.component';
import {GanttChartTasksComponent} from './tasks/gantt-chart-tasks.component';
import {GanttChartHeaderComponent} from './tasks/header/gantt-chart-header.component';
import {GanttChartInvalidRangeComponent} from './tasks/invalid-range/gantt-chart-invalid-range.component';

@NgModule({
  imports: [SharedModule, RouterModule, PickerModule, GanttChartPerspectiveRoutingModule, GanttChartPipesModule],
  declarations: [
    GanttChartPerspectiveComponent,
    GanttChartVisualizationComponent,
    GanttChartConfigComponent,
    GanttChartStemConfigComponent,
    GanttChartTasksComponent,
    GanttChartHeaderComponent,
    GanttChartInvalidRangeComponent,
  ],
  entryComponents: [GanttChartPerspectiveComponent],
  exports: [GanttChartPerspectiveComponent],
})
export class GanttChartPerspectiveModule {}
