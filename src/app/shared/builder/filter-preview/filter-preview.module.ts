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

import {DataInputModule} from '../../data-input/data-input.module';
import {PipesModule} from '../../pipes/pipes.module';
import {FilterBuilderModule} from '../filter-builder/filter-builder.module';
import {FilterBuilderPipesModule} from '../pipes/filter-builder-pipes.module';
import {FilterPreviewComponent} from './filter-preview.component';

@NgModule({
  declarations: [FilterPreviewComponent],
  imports: [CommonModule, DataInputModule, FilterBuilderModule, PipesModule, FilterBuilderPipesModule],
  exports: [FilterPreviewComponent],
})
export class FilterPreviewModule {}
