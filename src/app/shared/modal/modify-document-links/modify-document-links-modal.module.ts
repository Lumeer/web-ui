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
import {SelectModule} from '../../select/select.module';
import {PipesModule} from '../../pipes/pipes.module';
import {ModifyDocumentLinksModalComponent} from './modify-document-links-modal.component';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {PreviewResultsModule} from '../../preview-results/preview-results.module';
import {CollectionFiltersComponent} from './filters/collection-filters.component';
import {CollectionFilterComponent} from './filters/filter/collection-filter.component';
import {FilterBuilderModule} from '../../builder/filter-builder/filter-builder.module';
import {FilterPreviewModule} from '../../builder/filter-preview/filter-preview.module';
import {ResultsTableComponent} from './results-table/results-table.component';
import {DataInputModule} from '../../data-input/data-input.module';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {InputModule} from '../../input/input.module';

@NgModule({
  declarations: [ModifyDocumentLinksModalComponent, CollectionFiltersComponent, CollectionFilterComponent, ResultsTableComponent],
  imports: [
    CommonModule,
    SelectModule,
    PipesModule,
    ModalWrapperModule,
    PreviewResultsModule,
    FilterBuilderModule,
    FilterPreviewModule,
    DataInputModule,
    ScrollingModule,
    InputModule,
  ],
  exports: [ModifyDocumentLinksModalComponent],
})
export class ModifyDocumentLinksModalModule {}
