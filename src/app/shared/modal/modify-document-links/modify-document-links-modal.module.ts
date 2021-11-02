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
import {ScrollingModule} from '@angular/cdk/scrolling';
import {SelectModule} from '../../select/select.module';
import {PipesModule} from '../../pipes/pipes.module';
import {ModifyDocumentLinksModalComponent} from './modify-document-links-modal.component';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {PreviewResultsModule} from '../../preview-results/preview-results.module';
import {FilterBuilderModule} from '../../builder/filter-builder/filter-builder.module';
import {FilterPreviewModule} from '../../builder/filter-preview/filter-preview.module';
import {ResultsTableComponent} from './results-table/results-table.component';
import {DataInputModule} from '../../data-input/data-input.module';
import {InputModule} from '../../input/input.module';
import {IsResultRowCheckedPipe} from './results-table/pipes/is-result-row-checked.pipe';
import {WarningMessageModule} from '../../warning-message/warning-message.module';
import {CountSelectedLinkedDocumentsPipe} from './pipes/count-selected-linked-documents.pipe';
import {FiltersModule} from '../../filters/filters.module';

@NgModule({
  declarations: [
    ModifyDocumentLinksModalComponent,
    ResultsTableComponent,
    IsResultRowCheckedPipe,
    CountSelectedLinkedDocumentsPipe,
  ],
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
    WarningMessageModule,
    FiltersModule,
  ],
  exports: [ModifyDocumentLinksModalComponent],
})
export class ModifyDocumentLinksModalModule {}
