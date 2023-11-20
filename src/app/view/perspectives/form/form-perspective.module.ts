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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {DirectivesModule} from '../../../shared/directives/directives.module';
import {DocumentHintsModule} from '../../../shared/document-hints/document-hints.module';
import {DropdownModule} from '../../../shared/dropdown/dropdown.module';
import {FiltersModule} from '../../../shared/filters/filters.module';
import {InputModule} from '../../../shared/input/input.module';
import {LayoutModule} from '../../../shared/layout/layout.module';
import {PickerModule} from '../../../shared/picker/picker.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {PresenterModule} from '../../../shared/presenter/presenter.module';
import {PreviewResultsModule} from '../../../shared/preview-results/preview-results.module';
import {SelectModule} from '../../../shared/select/select.module';
import {AttributesSettingsModule} from '../../../shared/settings/attributes/attributes-settings.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {FormEditorButtonComponent} from './content/editor/buttons/button/form-editor-button.component';
import {FormEditorButtonsComponent} from './content/editor/buttons/form-editor-buttons.component';
import {FormEditorComponent} from './content/editor/form-editor.component';
import {FormEditorCellAttributeActionsComponent} from './content/editor/row/cell/actions/attribute/form-editor-cell-attribute-actions.component';
import {FormEditorCellActionsComponent} from './content/editor/row/cell/actions/form-editor-cell-actions.component';
import {FormLinkAttributesSettingsDropdownComponent} from './content/editor/row/cell/actions/link/attributes-settings/form-link-attributes-settings-dropdown.component';
import {FormEditorCellLinkActionsComponent} from './content/editor/row/cell/actions/link/form-editor-cell-link-actions.component';
import {FormLinkRangeDropdownComponent} from './content/editor/row/cell/actions/link/range/form-link-range-dropdown.component';
import {FormEditorCellComponent} from './content/editor/row/cell/form-editor-cell.component';
import {FormEditorRowComponent} from './content/editor/row/form-editor-row.component';
import {FormEditorSectionComponent} from './content/editor/section/form-editor-section.component';
import {FormPerspectiveContentComponent} from './content/form-perspective-content.component';
import {FormModeComponent} from './content/mode/form-mode.component';
import {FormDocumentsChooseComponent} from './content/view/choose/form-documents-choose.component';
import {FormViewComponent} from './content/view/form-view.component';
import {FormViewCellComponent} from './content/view/row/cell/form-view-cell.component';
import {FormViewCellLinkComponent} from './content/view/row/cell/link/form-view-cell-link.component';
import {FormViewRowComponent} from './content/view/row/form-view-row.component';
import {FormViewSectionComponent} from './content/view/section/form-view-section.component';
import {FormViewSubmitComponent} from './content/view/submit/form-view-submit.component';
import {FormPerspectiveRoutingModule} from './form-perspective-routing.module';
import {FormPerspectiveComponent} from './form-perspective.component';
import {CollectionHintColumnsPipe} from './pipes/collection-hint-columns.pipe';
import {FilterValidCellsPipe} from './pipes/filter-valid-cells.pipe';
import {FormCellIsEditedPipe} from './pipes/form-cell-is-edited.pipe';
import {FormCellLockStatsPipe} from './pipes/form-cell-lock-stats.pipe';
import {FormErrorsByCellPipe} from './pipes/form-errors-by-cell.pipe';
import {FormErrorsByRowPipe} from './pipes/form-errors-by-row.pipe';
import {FormErrorsBySectionPipe} from './pipes/form-errors-by-section.pipe';
import {LinkCollectionDisplayedAttributePipe} from './pipes/link-collection-displayed-attribute.pipe';
import {SelectedLayoutInRowPipe} from './pipes/selected-layout-in-row.pipe';

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
    FormViewComponent,
    FormViewSectionComponent,
    FormViewRowComponent,
    FormViewCellComponent,
    FormViewSubmitComponent,
    FormModeComponent,
    FormErrorsBySectionPipe,
    FormErrorsByRowPipe,
    FormErrorsByCellPipe,
    FormViewCellLinkComponent,
    LinkCollectionDisplayedAttributePipe,
    FormDocumentsChooseComponent,
    FormCellIsEditedPipe,
    FormCellLockStatsPipe,
    CollectionHintColumnsPipe,
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
    DataInputModule,
    PreviewResultsModule,
    PresenterModule,
    DocumentHintsModule,
  ],
  exports: [FormPerspectiveComponent],
})
export class FormPerspectiveModule {}
