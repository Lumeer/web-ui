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
import {PickerModule} from '../../../shared/picker/picker.module';
import {SharedModule} from '../../../shared/shared.module';
import {MapContentComponent} from './content/map-content.component';
import {EmptyMapComponent} from './content/empty/empty-map.component';
import {MapPerspectiveRoutingModule} from './map-perspective-routing.module';
import {MapPerspectiveComponent} from './map-perspective.component';
import {MapAttributeSelectComponent} from './panel/attribute-select/map-attribute-select.component';
import {MapPanelComponent} from './panel/map-panel.component';
import { MapRenderComponent } from './content/render/map-render.component';
import { MapAttributeGroupComponent } from './panel/attribute-group/map-attribute-group.component';
import { MapAttributeIdsPipe } from './panel/map-attribute-ids.pipe';

@NgModule({
  imports: [
    PickerModule,
    SharedModule,
    MapPerspectiveRoutingModule,
  ],
  declarations: [
    MapPerspectiveComponent,
    MapContentComponent,
    MapPanelComponent,
    MapAttributeSelectComponent,
    EmptyMapComponent,
    MapRenderComponent,
    MapAttributeGroupComponent,
    MapAttributeIdsPipe
  ],
  entryComponents: [
    MapPerspectiveComponent
  ],
  exports: [
    MapPerspectiveComponent
  ]
})
export class MapPerspectiveModule {
}
