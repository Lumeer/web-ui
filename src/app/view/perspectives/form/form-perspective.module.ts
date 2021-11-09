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
import {FormPerspectiveComponent} from './form-perspective.component';
import {RouterModule} from '@angular/router';
import {FormPerspectiveRoutingModule} from './form-perspective-routing.module';
import {FormPerspectiveContentComponent} from './content/form-perspective-content.component';
import {FormEditorComponent} from './content/editor/form-editor.component';
import {LayoutModule} from '../../../shared/layout/layout.module';
import {FormEditorRowComponent} from './content/editor/row/form-editor-row.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormEditorCellComponent} from './content/editor/row/cell/form-editor-cell.component';
import {SelectedLayoutInRowPipe} from './pipes/selected-layout-in-row.pipe';
import {FilterValidCellsPipe} from './pipes/filter-valid-cells.pipe';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {SelectModule} from '../../../shared/select/select.module';
import {InputModule} from '../../../shared/input/input.module';
import {FormEditorSectionComponent} from './content/editor/section/form-editor-section.component';
import {DirectivesModule} from '../../../shared/directives/directives.module';
import {FormsModule} from '@angular/forms';
import {FormEditorCellActionsComponent} from './content/editor/row/cell/actions/form-editor-cell-actions.component';
import {FormEditorCellLinkActionsComponent} from './content/editor/row/cell/actions/link/form-editor-cell-link-actions.component';
import {FormLinkAttributesSettingsDropdownComponent} from './content/editor/row/cell/actions/link/attributes-settings/form-link-attributes-settings-dropdown.component';
import {DropdownModule} from '../../../shared/dropdown/dropdown.module';
import {AttributesSettingsModule} from '../../../shared/settings/attributes/attributes-settings.module';
import {FiltersModule} from '../../../shared/filters/filters.module';
import {FormEditorCellAttributeActionsComponent} from './content/editor/row/cell/actions/attribute/form-editor-cell-attribute-actions.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {FormLinkRangeDropdownComponent} from './content/editor/row/cell/actions/link/range/form-link-range-dropdown.component';
import {FormEditorButtonsComponent} from './content/editor/buttons/form-editor-buttons.component';
import {FormEditorButtonComponent} from './content/editor/buttons/button/form-editor-button.component';
import {PickerModule} from '../../../shared/picker/picker.module';

@NgModule({
  declarations: [
    FormPerspectiveComponent,
    FormPerspectiveContentComponent,
    FormEditorComponent,
    FormEditorRowComponent,
    FormEditorCellComponent,
    SelectedLayoutInRowPipe,
    FilterValidCellsPipe,
    FormEditorSectionComponent,
    FormEditorCellActionsComponent,
    FormEditorCellLinkActionsComponent,
    FormLinkAttributesSettingsDropdownComponent,
    FormEditorCellAttributeActionsComponent,
    FormLinkRangeDropdownComponent,
    FormEditorButtonsComponent,
    FormEditorButtonComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormPerspectiveRoutingModule,
    LayoutModule,
    DragDropModule,
    PipesModule,
    WarningMessageModule,
    SelectModule,
    InputModule,
    DirectivesModule,
    FormsModule,
    DropdownModule,
    AttributesSettingsModule,
    FiltersModule,
    TooltipModule,
    PickerModule,
  ],
  exports: [FormPerspectiveComponent],
})
export class FormPerspectiveModule {}
