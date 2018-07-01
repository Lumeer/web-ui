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
import {RouterModule} from '@angular/router';
import {LanguageModule} from '../language/language.module';
import {PipesModule} from '../pipes/pipes.module';
import {ResourceMenuModule} from './resource-menu/resource-menu.module';
import {SearchBoxModule} from './search-box/search-box.module';
import {TopPanelComponent} from './top-panel.component';
import {TopPanelWrapperComponent} from './wrapper/top-panel-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    LanguageModule,
    PipesModule,
    RouterModule,
    ResourceMenuModule,
    SearchBoxModule,
  ],
  declarations: [
    TopPanelComponent,
    TopPanelWrapperComponent,
  ],
  exports: [
    TopPanelWrapperComponent,
  ]
})
export class TopPanelModule {
}
