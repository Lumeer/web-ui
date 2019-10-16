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
import {DocumentDetailComponent} from './document-detail/document-detail.component';
import {InputModule} from '../input/input.module';
import {PipesModule} from '../pipes/pipes.module';
import {DataInputModule} from '../data-input/data-input.module';
import {PostItDocumentModule} from './post-it/post-it-document.module';
import {DocumentDetailHeaderComponent} from './document-detail/header/document-detail-header.component';
import {DocumentDataComponent} from './document-detail/data/document-data.component';
import {DocumentDataRowComponent} from './document-detail/data/row/document-data-row.component';
import {DocumentDataRowIconsComponent} from './document-detail/data/row/icons/document-data-row-icons.component';
import {AttributeTypeModalModule} from '../modal/attribute-type/attribute-type-modal.module';
import {AttributeFunctionModalModule} from '../modal/attribute-function/attribute-function-modal.module';
import {ClickOutsideModule} from 'ng-click-outside';
import {AttributesToDataSuggestionsPipe} from './document-detail/pipes/attributes-to-data-suggestions.pipe';
import {DocumentDetailHiddenInputComponent} from './document-detail/hidden-input/document-detail-hidden-input.component';
import {ColorPickerModule} from 'ngx-color-picker';

@NgModule({
  imports: [
    CommonModule,
    DataInputModule,
    InputModule,
    PipesModule,
    PostItDocumentModule,
    ClickOutsideModule,
    ColorPickerModule,
    AttributeTypeModalModule,
    AttributeFunctionModalModule,
  ],
  declarations: [
    DocumentDetailComponent,
    DocumentDetailHeaderComponent,
    DocumentDataComponent,
    DocumentDataRowComponent,
    DocumentDataRowIconsComponent,
    AttributesToDataSuggestionsPipe,
    DocumentDetailHiddenInputComponent,
  ],
  exports: [DocumentDetailComponent, PostItDocumentModule],
})
export class DocumentModule {}
