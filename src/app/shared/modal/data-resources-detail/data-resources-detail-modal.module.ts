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

import {DataResourceModule} from '../../data-resource/data-resource.module';
import {PipesModule} from '../../pipes/pipes.module';
import {PreviewResultsModule} from '../../preview-results/preview-results.module';
import {SelectModule} from '../../select/select.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {DataResourcesDetailModalComponent} from './data-resources-detail-modal.component';
import {DataResourcesDetailComponent} from './detail/data-resources-detail.component';
import {DataResourcesPreviewComponent} from './preview/data-resources-preview.component';

@NgModule({
  declarations: [DataResourcesDetailModalComponent, DataResourcesPreviewComponent, DataResourcesDetailComponent],
  imports: [CommonModule, SelectModule, PipesModule, ModalWrapperModule, PreviewResultsModule, DataResourceModule],
  exports: [DataResourcesDetailModalComponent],
})
export class DataResourcesDetailModalModule {}
