/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {ChartPerspectiveRoutingModule} from './chart-perspective-routing.module';
import {ChartPerspectiveComponent} from './chart-perspective.component';
import {ChartVisualizationComponent} from './components/chart-visualization/chart-visualization.component';
import {ChartConfigComponent} from './chart-config/chart-config.component';
import {ChartAttributeSelectComponent} from './chart-config/chart-attribute-select/chart-attribute-select.component';
import {ChartTypeSelectComponent} from './chart-config/chart-type-select/chart-type-select.component';
import {DisplayablePipe} from './pipes/displayable.pipe';
import {ChartTypeIconPipe} from './pipes/chart-type-icon.pipe';
import {PickerModule} from '../../../shared/picker/picker.module';
import {AttributeNamePipe} from './pipes/attribute-name.pipe';

@NgModule({
  imports: [
    SharedModule,
    RouterModule,
    PickerModule,
    ChartPerspectiveRoutingModule
  ],
  declarations: [
    ChartPerspectiveComponent,
    ChartVisualizationComponent,
    ChartConfigComponent,
    ChartAttributeSelectComponent,
    ChartTypeSelectComponent,
    DisplayablePipe,
    ChartTypeIconPipe,
    AttributeNamePipe
  ],
  entryComponents: [
    ChartPerspectiveComponent
  ],
  exports: [
    ChartPerspectiveComponent
  ]
})
export class ChartPerspectiveModule {

}
