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
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {CommentsComponent} from './comments/comments.component';
import {DragAndDropModule} from './drag-and-drop/drag-and-drop.module';
import {InputModule} from './input/input.module';
import {PerspectiveDirective} from './perspective.directive';
import {PickerModule} from './picker/picker.module';
import {PipesModule} from './pipes/pipes.module';
import {RemovePlaceholderOnFocusDirective} from './placeholder/remove-placeholder-on-focus';
import {PostItCollectionsModule} from './post-it-collections/post-it-collections.module';
import {ResourceHeaderComponent} from './resource/header/resource-header.component';
import {SearchBoxModule} from './search-box/search-box.module';
import {SizeSliderComponent} from './slider/size-slider.component';
import {SliderComponent} from './slider/slider.component';
import {UsersModule} from './users/users.module';
import {TagModule} from './tag/tag.module';
import {DocumentModule} from './document/document.module';
import {PreviewResultsModule} from './preview-results/preview-results.module';
import {LinksModule} from './links/links.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PickerModule,
    DragAndDropModule,
    SearchBoxModule,
    UsersModule,
    TagModule,
    InputModule,
    PostItCollectionsModule,
    DocumentModule,
    PreviewResultsModule,
    LinksModule,
    PipesModule
  ],
  declarations: [
    SizeSliderComponent,
    CommentsComponent,
    PerspectiveDirective,
    RemovePlaceholderOnFocusDirective,
    SliderComponent,
    ResourceHeaderComponent,
  ],
  exports: [
    CommonModule,
    DragAndDropModule,
    FormsModule,
    PostItCollectionsModule,
    SizeSliderComponent,
    CommentsComponent,
    PerspectiveDirective,
    RemovePlaceholderOnFocusDirective,
    UsersModule,
    SearchBoxModule,
    SliderComponent,
    PipesModule,
    TagModule,
    InputModule,
    ResourceHeaderComponent,
    DocumentModule,
    PreviewResultsModule,
    LinksModule,
    PipesModule,
  ]
})
export class SharedModule {

}
