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

import {ModalModule} from '../../../shared/modal/modal.module';
import {SharedModule} from '../../../shared/shared.module';
import {ChartPerspectiveRoutingModule} from './chart-perspective-routing.module';
import {ChartPerspectiveComponent} from './chart-perspective.component';
import {ChartConfigComponent} from './config/chart-config.component';
import {ChartMainConfigComponent} from './config/main/chart-main-config.component';
import {ChartSettingsConfigComponent} from './config/settings/chart-settings-config.component';
import {ChartYAxisConfigComponent} from './config/y-axis/chart-y-axis-config.component';
import {ChartDataComponent} from './data/chart-data.component';
import {ChartVisualizerComponent} from './data/visualizer/chart-visualizer.component';
import {ChartPipesModule} from './pipes/chart-pipes.module';

@NgModule({
  imports: [SharedModule, RouterModule, ChartPerspectiveRoutingModule, ChartPipesModule, ModalModule],
  declarations: [
    ChartPerspectiveComponent,
    ChartConfigComponent,
    ChartDataComponent,
    ChartVisualizerComponent,
    ChartMainConfigComponent,
    ChartYAxisConfigComponent,
    ChartSettingsConfigComponent,
  ],
  exports: [ChartPerspectiveComponent],
})
export class ChartPerspectiveModule {}
