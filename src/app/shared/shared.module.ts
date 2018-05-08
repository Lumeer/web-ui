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
import {DialogsModule} from './dialogs/dialogs.module';
import {DragAndDropModule} from './drag-and-drop/drag-and-drop.module';
import {LinksComponent} from './links/links.component';

import {PerspectiveDirective} from './perspective.directive';
import {PickerModule} from './picker/picker.module';
import {PostItCollectionsComponent} from './post-it-collections/post-it-collections.component';
import {SearchBoxModule} from './search-box/search-box.module';
import {SizeSliderComponent} from './slider/size-slider.component';
import {LayoutItem} from './utils/layout/layout-item.directive';
import {PostItCollectionNameComponent} from './post-it-collections/collection-name/post-it-collection-name.component';
import {RemovePlaceholderOnFocusDirective} from './placeholder/remove-placeholder-on-focus';
import {PostItCollectionAddButtonComponent} from './post-it-collections/add-button/post-it-collection-add-button.component';
import {PostItCollectionImportButtonComponent} from './post-it-collections/import-button/post-it-collection-import-button.component';
import {SliderComponent} from './slider/slider.component';
import {UsersModule} from "./users/users.module";
import {TagModule} from "./tag/tag.module";
import {InputModule} from "./input/input.module";
import {ResourceHeaderComponent} from './resource/header/resource-header.component';
import { PreviewResultsComponent } from './preview-results/preview-results.component';
import { PreviewResultsTabsComponent } from './preview-results/preview-results-tabs/preview-results-tabs.component';
import { PreviewResultsTableComponent } from './preview-results/preview-results-table/preview-results-table.component';
import { DocumentDetailComponent } from './document/document-detail/document-detail.component';
import { LinksListComponent } from './links/links-list/links-list.component';
import { LinksListTabsComponent } from './links/links-list/links-list-tabs/links-list-tabs.component';
import { LinksListTableComponent } from './links/links-list/links-list-table/links-list-table.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PickerModule,
    DragAndDropModule,
    SearchBoxModule,
    UsersModule,
    DialogsModule,
    TagModule,
    InputModule
  ],
  declarations: [
    PostItCollectionsComponent,
    PostItCollectionNameComponent,
    PostItCollectionAddButtonComponent,
    PostItCollectionImportButtonComponent,
    SizeSliderComponent,
    CommentsComponent,
    LinksComponent,
    PerspectiveDirective,
    RemovePlaceholderOnFocusDirective,
    LayoutItem,
    SliderComponent,
    LayoutItem,
    ResourceHeaderComponent,
    PreviewResultsComponent,
    PreviewResultsTabsComponent,
    PreviewResultsTableComponent,
    DocumentDetailComponent,
    LinksListComponent,
    LinksListTabsComponent,
    LinksListTableComponent
  ],
  exports: [
    CommonModule,
    DragAndDropModule,
    FormsModule,
    PostItCollectionsComponent,
    SizeSliderComponent,
    CommentsComponent,
    LinksComponent,
    PerspectiveDirective,
    RemovePlaceholderOnFocusDirective,
    UsersModule,
    SearchBoxModule,
    SliderComponent,
    TagModule,
    InputModule,
    DialogsModule,
    ResourceHeaderComponent,
    PreviewResultsComponent,
    DocumentDetailComponent,
    LinksListComponent
  ]
})
export class SharedModule {

}
