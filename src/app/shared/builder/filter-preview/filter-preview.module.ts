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
import {FilterPreviewComponent} from './filter-preview.component';
import {TranslateConditionPipe} from './pipes/translate-condition.pipe';
import {TranslateConditionValuePipe} from './pipes/translate-condition-value.pipe';
import {DataInputModule} from '../../data-input/data-input.module';
import {FilterBuilderModule} from '../filter-builder/filter-builder.module';
import {PipesModule} from '../../pipes/pipes.module';
import {ConditionNumValuesPipe} from './pipes/condition-num-values.pipe';

@NgModule({
  declarations: [FilterPreviewComponent, TranslateConditionPipe, TranslateConditionValuePipe, ConditionNumValuesPipe],
  imports: [CommonModule, DataInputModule, FilterBuilderModule, PipesModule],
  exports: [FilterPreviewComponent],
})
export class FilterPreviewModule {}
