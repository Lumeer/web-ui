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
import {RouterModule} from '@angular/router';

import {SharedModule} from '../../../shared/shared.module';
import {PostItAddDocumentComponent} from './add-document/add-document.component';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {PostItPerspectiveComponent} from './post-it-perspective.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule
  ],
  declarations: [
    PostItAddDocumentComponent,
    PostItDocumentComponent,
    PostItPerspectiveComponent
  ],
  entryComponents: [
    PostItPerspectiveComponent
  ],
  exports: [
    PostItPerspectiveComponent
  ]
})
export class PostItPerspectiveModule {

}
