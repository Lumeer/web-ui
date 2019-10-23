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
import {FormsModule} from '@angular/forms';
import {IconChooseComponent} from './icon-color/icon/icon-choose.component';
import {ColorChooseComponent} from './icon-color/color/color-choose.component';
import {IconColorPickerComponent} from './icon-color/icon-color-picker.component';
import {HighlightColorPipe} from './icon-color/pipes/highlight-color.pipe';
import {IconIdPipe} from './icon-color/pipes/icon-id.pipe';
import {PipesModule} from '../pipes/pipes.module';
import {IconFilterPipe} from './icon-color/pipes/icon-filter.pipe';
import {ColorPickerModule} from 'ngx-color-picker';
import {DropdownModule} from '../dropdown/dropdown.module';
import {ColorPickerComponent} from './color/color-picker.component';

@NgModule({
  imports: [CommonModule, FormsModule, PipesModule, ColorPickerModule, DropdownModule],
  declarations: [
    IconChooseComponent,
    ColorChooseComponent,
    IconColorPickerComponent,
    ColorPickerComponent,
    HighlightColorPipe,
    IconIdPipe,
    IconFilterPipe,
    ColorChooseComponent,
  ],
  exports: [IconColorPickerComponent, ColorPickerComponent],
})
export class PickerModule {}
