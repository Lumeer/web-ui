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
import {PostItComponent} from './post-it.component';
import {DataInputModule} from '../data-input/data-input.module';
import {PostItRowComponent} from './row/post-it-row.component';
import {PipesModule} from '../pipes/pipes.module';
import {ClickOutsideModule} from 'ng-click-outside';
import {PostItHeaderComponent} from './header/post-it-header.component';
import {PresenterModule} from '../presenter/presenter.module';
import {ResourceIconsColorsPipe} from './pipes/resource-icons-colors.pipe';
import {DataResourceFavoritePipe} from './pipes/data-resource-favorite.pipe';
import {InputModule} from '../input/input.module';
import {DragDropModule} from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    PostItComponent,
    PostItRowComponent,
    PostItHeaderComponent,
    ResourceIconsColorsPipe,
    DataResourceFavoritePipe,
  ],
  imports: [
    CommonModule,
    DataInputModule,
    PipesModule,
    PresenterModule,
    ClickOutsideModule,
    InputModule,
    DragDropModule,
  ],
  exports: [PostItComponent],
})
export class PostItModule {}
