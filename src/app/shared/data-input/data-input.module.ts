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

import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {TypeaheadModule} from 'ngx-bootstrap/typeahead';
import {ColorPickerModule} from 'ngx-color-picker';
import {GravatarModule} from 'ngx-gravatar';
import {QuillModule} from 'ngx-quill';

import {FilterBuilderPipesModule} from '../builder/pipes/filter-builder-pipes.module';
import {DateTimeModule} from '../date-time/date-time.module';
import {DirectivesModule} from '../directives/directives.module';
import {DropdownModule} from '../dropdown/dropdown.module';
import {TextEditorModalModule} from '../modal/text-editor/text-editor-modal.module';
import {PickerModule} from '../picker/picker.module';
import {PipesModule} from '../pipes/pipes.module';
import {ProgressModule} from '../progress/progress.module';
import {ActionDataInputComponent} from './action/action-data-input.component';
import {AddressDataInputComponent} from './address/address-data-input.component';
import {BooleanDataInputComponent} from './boolean/boolean-data-input.component';
import {ColorDataInputComponent} from './color/color-data-input.component';
import {DataInputCompactComponent} from './compact/data-input-compact.component';
import {SelectDataInputCompactComponent} from './compact/select/select-data-input-compact.component';
import {UserDataInputCompactComponent} from './compact/user/user-data-input-compact.component';
import {CoordinatesDataInputComponent} from './coordinates/coordinates-data-input.component';
import {DataInputComponent} from './data-input.component';
import {DatetimeDataInputComponent} from './datetime/datetime-data-input.component';
import {DurationDataInputComponent} from './duration/duration-data-input.component';
import {FileAttachmentButtonComponent} from './files/button/file-attachment-button.component';
import {FileAttachmentTooltipComponent} from './files/button/tooltip/file-attachment-tooltip.component';
import {FilesDropdownComponent} from './files/dropdown/files-dropdown.component';
import {FileButtonComponent} from './files/file-button/file-button.component';
import {FileTypeIconPipe} from './files/file-type-icon.pipe';
import {FilesDataInputComponent} from './files/files-data-input.component';
import {LinkInputDropdownComponent} from './link/dropdown/link-input-dropdown.component';
import {LinkDataInputComponent} from './link/link-data-input.component';
import {AttributeLockFiltersStatsComponent} from './lock-stats/attribute-lock-filters-stats.component';
import {AttributeLockFilterPreviewComponent} from './lock-stats/preview/attribute-lock-filter-preview.component';
import {NumberDataInputComponent} from './number/number-data-input.component';
import {PercentageDataInputComponent} from './percentage/percentage-data-input.component';
import {ConstraintAsTextPipe} from './pipes/constraint-as-text.pipe';
import {ConstraintClassPipe} from './pipes/constraint-class.pipe';
import {DataCursorPipe} from './pipes/data-cursor.pipe';
import {DataIdCursorPipe} from './pipes/data-id-cursor.pipe';
import {FilterDataSuggestionsPipe} from './pipes/filter-data-suggestions.pipe';
import {DataInputPreviewComponent} from './preview/data-input-preview.component';
import {RichTextDropdownComponent} from './rich-text/dropdown/rich-text-dropdown.component';
import {RichTextDataInputComponent} from './rich-text/rich-text-data-input.component';
import {SelectOptionIsValidPipe} from './select/pipes/select-option-is-valid.pipe';
import {SelectOptionsJoinedPipe} from './select/pipes/select-options-joined.pipe';
import {SelectOptionsValuesPipe} from './select/pipes/select-options-values.pipe';
import {SelectDataInputComponent} from './select/select-data-input.component';
import {TextDataInputComponent} from './text/text-data-input.component';
import {FilterUsersAndTeamsPipe} from './user/pipes/filter-users-and-teams.pipe';
import {UserIsValidPipe} from './user/pipes/user-is-valid.pipe';
import {UsersAndTeamsNamesPipe} from './user/pipes/users-and-teams-names.pipe';
import {UsersAreValidPipe} from './user/pipes/users-are-valid.pipe';
import {SelectedValuesPipe} from './user/pipes/users-emails.pipe';
import {UsersNamesPipe} from './user/pipes/users-names.pipe';
import {UserDataInputComponent} from './user/user-data-input.component';
import {FilterValidViewsPipe} from './view/pipes/filter-valid-views.pipe';
import {FilterViewsPipe} from './view/pipes/filter-views.pipe';
import {ViewsIdsPipe} from './view/pipes/views-ids.pipe';
import {ViewDataInputComponent} from './view/view-data-input.component';

@NgModule({
  imports: [
    BsDatepickerModule,
    CommonModule,
    FormsModule,
    PipesModule,
    DateTimeModule,
    DirectivesModule,
    ColorPickerModule,
    PickerModule,
    GravatarModule,
    TypeaheadModule,
    DropdownModule,
    TooltipModule,
    QuillModule,
    TextEditorModalModule,
    ReactiveFormsModule,
    FilterBuilderPipesModule,
    ProgressModule,
    RouterModule,
  ],
  declarations: [
    DataInputComponent,
    TextDataInputComponent,
    DatetimeDataInputComponent,
    NumberDataInputComponent,
    BooleanDataInputComponent,
    PercentageDataInputComponent,
    ColorDataInputComponent,
    UserDataInputComponent,
    UserDataInputCompactComponent,
    SelectDataInputComponent,
    SelectDataInputCompactComponent,
    CoordinatesDataInputComponent,
    AddressDataInputComponent,
    DurationDataInputComponent,
    FilesDataInputComponent,
    DataCursorPipe,
    DataIdCursorPipe,
    FileTypeIconPipe,
    FilesDropdownComponent,
    FileAttachmentButtonComponent,
    RichTextDataInputComponent,
    FilterDataSuggestionsPipe,
    FilterUsersAndTeamsPipe,
    SelectOptionIsValidPipe,
    SelectOptionsValuesPipe,
    SelectedValuesPipe,
    UsersAreValidPipe,
    UserIsValidPipe,
    UsersNamesPipe,
    UsersAndTeamsNamesPipe,
    DataInputPreviewComponent,
    DataInputCompactComponent,
    ConstraintAsTextPipe,
    ConstraintClassPipe,
    SelectOptionsJoinedPipe,
    LinkDataInputComponent,
    LinkInputDropdownComponent,
    ActionDataInputComponent,
    AttributeLockFiltersStatsComponent,
    AttributeLockFilterPreviewComponent,
    FilterViewsPipe,
    FilterValidViewsPipe,
    ViewsIdsPipe,
    ViewDataInputComponent,
    FileButtonComponent,
    FileAttachmentTooltipComponent,
    RichTextDropdownComponent,
  ],
  exports: [
    DataInputComponent,
    DataInputPreviewComponent,
    DataInputCompactComponent,
    BooleanDataInputComponent,
    UserDataInputComponent,
    UserDataInputCompactComponent,
    DataCursorPipe,
    DataIdCursorPipe,
    FileAttachmentButtonComponent,
    SelectDataInputComponent,
    TextDataInputComponent,
    RichTextDataInputComponent,
    ConstraintAsTextPipe,
    ConstraintClassPipe,
    FilterUsersAndTeamsPipe,
    ActionDataInputComponent,
    ViewDataInputComponent,
    AttributeLockFiltersStatsComponent,
    LinkDataInputComponent,
  ],
})
export class DataInputModule {}
