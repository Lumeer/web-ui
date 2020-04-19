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
import {DataValuePipe} from './data-value.pipe';
import {FormatDataValuePipe} from './format-data-value.pipe';
import {IsDataValueValidPipe} from './is-data-value-valid.pipe';
import {SerializeDataValuePipe} from './serialize-data-value.pipe';
import {PreviewDataValuePipe} from './preview-data-value.pipe';
import {FormatDataValueForEditPipe} from './format-data-value-for-edit.pipe';
import {FormatDataValueTitlePipe} from './format-data-value-title.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DataValuePipe,
    FormatDataValuePipe,
    IsDataValueValidPipe,
    SerializeDataValuePipe,
    PreviewDataValuePipe,
    FormatDataValueForEditPipe,
    FormatDataValueTitlePipe,
  ],
  exports: [
    DataValuePipe,
    FormatDataValuePipe,
    IsDataValueValidPipe,
    SerializeDataValuePipe,
    PreviewDataValuePipe,
    FormatDataValueForEditPipe,
    FormatDataValueTitlePipe,
  ],
})
export class DataPipesModule {}
