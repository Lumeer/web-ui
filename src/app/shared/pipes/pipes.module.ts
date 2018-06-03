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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ColorsPipe} from './colors.pipe';
import {FilterPerspectivesPipe} from './filter-perspectives.pipe';
import {IconsPipe} from './icons.pipe';
import {LightenColorPipe} from './lighten-color.pipe';
import {NativeDatePipe} from './native-date.pipe';
import {PerspectiveIconPipe} from './perspective-icon.pipe';
import {PixelPipe} from './pixel.pipe';
import {PrefixPipe} from './prefix.pipe';
import { EmptyPipe } from './empty.pipe';
import { PermissionsPipe } from './permissions.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    LightenColorPipe,
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    FilterPerspectivesPipe,
    EmptyPipe,
    PermissionsPipe,
  ],
  exports: [
    LightenColorPipe,
    PixelPipe,
    IconsPipe,
    ColorsPipe,
    PrefixPipe,
    NativeDatePipe,
    PerspectiveIconPipe,
    FilterPerspectivesPipe,
    EmptyPipe,
    PermissionsPipe,
  ]
})
export class PipesModule {
}
