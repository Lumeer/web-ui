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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {BlocklyModule} from './blockly/blockly.module';
import {CollapsibleSidebarModule} from './collapsible-sidebar/collapsible-sidebar.module';
import {DateTimeModule} from './date-time/date-time.module';
import {DirectivesModule} from './directives/directives.module';
import {DocumentHintsModule} from './document-hints/document-hints.module';
import {DataResourceModule} from './data-resource/data-resource.module';
import {InputModule} from './input/input.module';
import {LinksModule} from './links/links.module';
import {LoadingIndicatorComponent} from './loading-indicator/loading-indicator.component';
import {PerspectiveDirective} from './perspective.directive';
import {PickerModule} from './picker/picker.module';
import {PipesModule} from './pipes/pipes.module';
import {PostItCollectionsModule} from './post-it-collections/post-it-collections.module';
import {PreviewResultsModule} from './preview-results/preview-results.module';
import {ResourceHeaderComponent} from './resource/header/resource-header.component';
import {SelectModule} from './select/select.module';
import {TagModule} from './tag/tag.module';
import {SearchBoxModule} from './top-panel/search-box/search-box.module';
import {TopPanelModule} from './top-panel/top-panel.module';
import {TourComponent} from './tour/tour.component';
import {UsersModule} from './users/users.module';
import {WarningMessageModule} from './warning-message/warning-message.module';
import {ModalModule} from './modal/modal.module';
import {PresenterModule} from './presenter/presenter.module';
import {DropdownModule} from './dropdown/dropdown.module';
import {SequencesModule} from './sequences/sequences.module';
import {DataDropdownModule} from './data-dropdown/data-dropdown.module';
import {BookmarksModule} from './bookmarks/bookmarks.module';
import {BuilderModule} from './builder/builder.module';
import {SliderModule} from './slider/slider.module';
import {SettingsModule} from './settings/settings.module';
import {TableModule} from './table/table.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PickerModule,
    UsersModule,
    TagModule,
    InputModule,
    InfiniteScrollModule,
    PostItCollectionsModule,
    DataResourceModule,
    PreviewResultsModule,
    LinksModule,
    SliderModule,
    PipesModule,
    DirectivesModule,
    TopPanelModule,
    WarningMessageModule,
    DocumentHintsModule,
    SelectModule,
    CollapsibleSidebarModule,
    BlocklyModule,
    DateTimeModule,
    ModalModule,
    PresenterModule,
    DropdownModule,
    DataDropdownModule,
    BookmarksModule,
    BuilderModule,
    SettingsModule,
    TableModule,
  ],
  declarations: [PerspectiveDirective, ResourceHeaderComponent, LoadingIndicatorComponent, TourComponent],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PostItCollectionsModule,
    SliderModule,
    PerspectiveDirective,
    UsersModule,
    SearchBoxModule,
    InfiniteScrollModule,
    TourComponent,
    PipesModule,
    TagModule,
    InputModule,
    ResourceHeaderComponent,
    DataResourceModule,
    PreviewResultsModule,
    LinksModule,
    DirectivesModule,
    TopPanelModule,
    WarningMessageModule,
    DocumentHintsModule,
    SelectModule,
    CollapsibleSidebarModule,
    LoadingIndicatorComponent,
    BlocklyModule,
    DateTimeModule,
    ModalModule,
    PresenterModule,
    DropdownModule,
    PickerModule,
    SequencesModule,
    DataDropdownModule,
    BookmarksModule,
    BuilderModule,
    SettingsModule,
    TableModule,
  ],
})
export class SharedModule {}
