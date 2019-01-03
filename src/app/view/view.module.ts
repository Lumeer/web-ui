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
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {PostItPerspectiveModule} from './perspectives/post-it/post-it-perspective.module';
import {TablePerspectiveModule} from './perspectives/table/table-perspective.module';
import {ViewControlsInfoPipe} from './view-controls/view-controls-info.pipe';
import {ViewControlsComponent} from './view-controls/view-controls.component';
import {ViewLoadingComponent} from './view-loading.component';
import {ViewRoutingModule} from './view-routing.module';
import {ViewComponent} from './view.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    RouterModule,
    PostItPerspectiveModule,
    SharedModule,
    TablePerspectiveModule,
    ViewRoutingModule,
  ],
  declarations: [ViewComponent, ViewControlsComponent, ViewLoadingComponent, ViewControlsInfoPipe],
})
export class ViewModule {}
