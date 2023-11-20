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

import {ModalModule} from '../../../shared/modal/modal.module';
import {SharedModule} from '../../../shared/shared.module';
import {EmptyMapComponent} from './content/globe-content/empty/empty-map.component';
import {MapGlobeContentComponent} from './content/globe-content/map-globe-content.component';
import {MapGlobeRenderComponent} from './content/globe-content/render/map-globe-render.component';
import {InvalidImageMapComponent} from './content/image-content/invalid-image/invalid-image-map.component';
import {MapImageContentComponent} from './content/image-content/map-image-content.component';
import {MapImageRenderComponent} from './content/image-content/render/map-image-render.component';
import {MapLoadingComponent} from './content/loading/map-loading.component';
import {MapContentComponent} from './content/map-content.component';
import {MapPerspectiveRoutingModule} from './map-perspective-routing.module';
import {MapPerspectiveComponent} from './map-perspective.component';
import {ImageInputComponent} from './panel/image-input/image-input.component';
import {MapPanelComponent} from './panel/map-panel.component';
import {MapPositionCheckboxComponent} from './panel/position-checkbox/map-position-checkbox.component';
import {MapAttributeSelectComponent} from './panel/stem-config/attribute-select/map-attribute-select.component';
import {MapStemConfigComponent} from './panel/stem-config/map-stem-config.component';
import {AttributeSelectItemsPipe} from './pipes/attribute-select-items.pipe';
import {CanCreateRecordsInMapPipe} from './pipes/can-create-records-in-map.pipe';
import {ColorSelectItemsPipe} from './pipes/color-select-items.pipe';
import {MapModelFromConfigPipe} from './pipes/map-model-from-config.pipe';

@NgModule({
  imports: [SharedModule, ModalModule, MapPerspectiveRoutingModule],
  declarations: [
    MapPerspectiveComponent,
    MapContentComponent,
    MapPanelComponent,
    MapAttributeSelectComponent,
    EmptyMapComponent,
    MapGlobeRenderComponent,
    MapStemConfigComponent,
    MapPositionCheckboxComponent,
    MapLoadingComponent,
    ColorSelectItemsPipe,
    AttributeSelectItemsPipe,
    MapGlobeContentComponent,
    MapImageContentComponent,
    MapImageRenderComponent,
    ImageInputComponent,
    InvalidImageMapComponent,
    MapModelFromConfigPipe,
    CanCreateRecordsInMapPipe,
  ],
  exports: [MapPerspectiveComponent],
})
export class MapPerspectiveModule {}
