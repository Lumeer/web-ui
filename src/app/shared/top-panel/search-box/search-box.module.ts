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

import {FilterBuilderModule} from '../../builder/filter-builder/filter-builder.module';
import {FilterPreviewModule} from '../../builder/filter-preview/filter-preview.module';
import {DataInputModule} from '../../data-input/data-input.module';
import {DirectivesModule} from '../../directives/directives.module';
import {DropdownModule} from '../../dropdown/dropdown.module';
import {PickerModule} from '../../picker/picker.module';
import {PipesModule} from '../../pipes/pipes.module';
import {PresenterModule} from '../../presenter/presenter.module';
import {SettingsModule} from '../../settings/settings.module';
import {SearchButtonComponent} from './button/search-button.component';
import {SearchInputComponent} from './input/search-input.component';
import {SuggestionItemComponent} from './input/suggestions/item/search-suggestion-item.component';
import {SearchSuggestionsComponent} from './input/suggestions/search-suggestions.component';
import {SearchBoxPipesModule} from './query-item/pipes/search-box-pipes.module';
import {QueryItemComponent} from './query-item/query-item.component';
import {QueryStemInputQueryItemComponent} from './query-item/query-stem-input/query-stem-input-query-item.component';
import {QueryStemQueryItemComponent} from './query-item/query-stem/query-stem-query-item.component';
import {SimpleQueryItemComponent} from './query-item/simple/simple-query-item.component';
import {SearchBoxComponent} from './search-box.component';
import {SettingsButtonComponent} from './settings-button/settings-button.component';
import {ShouldShowAttributesSettingsPipe} from './settings-button/should-show-attributes-settings.pipe';
import {ShouldShowSettingsPipe} from './settings-button/should-show-settings.pipe';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PickerModule,
    PresenterModule,
    PipesModule,
    SearchBoxPipesModule,
    SettingsModule,
    DataInputModule,
    DirectivesModule,
    DropdownModule,
    FilterBuilderModule,
    FilterPreviewModule,
  ],
  declarations: [
    SearchBoxComponent,
    QueryItemComponent,
    SearchSuggestionsComponent,
    SearchInputComponent,
    SearchButtonComponent,
    SuggestionItemComponent,
    SettingsButtonComponent,
    ShouldShowAttributesSettingsPipe,
    ShouldShowSettingsPipe,
    SimpleQueryItemComponent,
    QueryStemQueryItemComponent,
    QueryStemInputQueryItemComponent,
  ],
  exports: [SearchBoxComponent, QueryItemComponent, SearchBoxPipesModule],
})
export class SearchBoxModule {}
