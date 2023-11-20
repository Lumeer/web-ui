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
import {GanttChartConfigComponent} from './config/gantt-chart-config.component';
import {GanttChartConfigSettingsComponent} from './config/settings/gantt-chart-config-settings.component';
import {GanttChartArrayBarModelSelectComponent} from './config/stem/array-select/gantt-chart-array-bar-model-select.component';
import {GanttChartBarModelSelectComponent} from './config/stem/bar-model-select/gantt-chart-bar-model-select.component';
import {GanttChartStemConfigComponent} from './config/stem/gantt-chart-stem-config.component';
import {GanttChartMilestonesSelectComponent} from './config/stem/milestones-select/gantt-chart-milestones-select.component';
import {GanttChartProgressBarModelSelectComponent} from './config/stem/progress-select/gantt-chart-progress-bar-model-select.component';
import {GanttChartPerspectiveRoutingModule} from './gantt-chart-perspective-routing.module';
import {GanttChartPerspectiveComponent} from './gantt-chart-perspective.component';
import {GanttChartPipesModule} from './pipes/gantt-chart-pipes.module';
import {GanttChartTasksComponent} from './tasks/gantt-chart-tasks.component';
import {GanttChartHeaderComponent} from './tasks/header/gantt-chart-header.component';
import {GanttChartInvalidRangeComponent} from './tasks/invalid-range/gantt-chart-invalid-range.component';
import {GanttChartVisualizationComponent} from './tasks/visualization/gantt-chart-visualization.component';

@NgModule({
  imports: [SharedModule, RouterModule, GanttChartPerspectiveRoutingModule, GanttChartPipesModule],
  declarations: [
    GanttChartPerspectiveComponent,
    GanttChartVisualizationComponent,
    GanttChartConfigComponent,
    GanttChartStemConfigComponent,
    GanttChartTasksComponent,
    GanttChartHeaderComponent,
    GanttChartInvalidRangeComponent,
    GanttChartConfigSettingsComponent,
    GanttChartBarModelSelectComponent,
    GanttChartMilestonesSelectComponent,
    GanttChartProgressBarModelSelectComponent,
    GanttChartArrayBarModelSelectComponent,
  ],
  exports: [GanttChartPerspectiveComponent],
})
export class GanttChartPerspectiveModule {}
