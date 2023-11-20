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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {PortalModule} from '@angular/cdk/portal';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {GravatarModule} from 'ngx-gravatar';

import {PipesModule} from '../pipes/pipes.module';
import {PresenterModule} from '../presenter/presenter.module';
import {DropdownComponent} from './dropdown.component';
import {FsCdkDragDirective} from './fullscreen/fs-cdk-drag.directive';
import {FullscreenDropdownComponent} from './fullscreen/fullscreen-dropdown.component';
import {DropdownOptionDirective} from './options/dropdown-option.directive';
import {OptionsDropdownComponent} from './options/options-dropdown.component';
import {DropdownOptionsValuesPipe} from './pipes/dropdown-options-values.pipe';
import {FilterDropdownOptionsPipe} from './pipes/filter-dropdown-options.pipe';
import {GroupDropdownOptionsPipe} from './pipes/group-dropdown-options.pipe';
import {ReverseArrayByDropdownPositionPipe} from './pipes/reverse-array-by-dropdown-position.pipe';
import {SelectItemsDropdownOptionsPipe} from './pipes/select-items-dropdown-options.pipe';

@NgModule({
  imports: [CommonModule, PresenterModule, GravatarModule, PipesModule, DragDropModule, PortalModule],
  declarations: [
    DropdownComponent,
    DropdownOptionDirective,
    OptionsDropdownComponent,
    FilterDropdownOptionsPipe,
    ReverseArrayByDropdownPositionPipe,
    GroupDropdownOptionsPipe,
    DropdownOptionsValuesPipe,
    SelectItemsDropdownOptionsPipe,
    FullscreenDropdownComponent,
    FsCdkDragDirective,
  ],
  exports: [
    DropdownComponent,
    DropdownOptionDirective,
    OptionsDropdownComponent,
    FilterDropdownOptionsPipe,
    ReverseArrayByDropdownPositionPipe,
    DropdownOptionsValuesPipe,
    SelectItemsDropdownOptionsPipe,
    FullscreenDropdownComponent,
  ],
})
export class DropdownModule {}
