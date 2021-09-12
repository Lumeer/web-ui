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
import {TabsSettingsModalComponent} from './tabs-settings-modal.component';
import {TabsSettingsContentComponent} from './content/tabs-settings-content.component';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {IsTabDefaultPipe} from './pipes/is-tab-default.pipe';
import {DashboardTabComponent} from './content/tab/dashboard-tab.component';
import {DashboardTabSettingsComponent} from './content/tab-settings/dashboard-tab-settings.component';
import {FormsModule} from '@angular/forms';
import {InputModule} from '../../input/input.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {DashboardRowsSettingsComponent} from './content/tab-settings/rows-settings/dashboard-rows-settings.component';
import {DashboardCellSettingsComponent} from './content/tab-settings/cell-settings/dashboard-cell-settings.component';
import {DashboardRowSettingsComponent} from './content/tab-settings/rows-settings/row-settings/dashboard-row-settings.component';
import {DashboardRowLayoutComponent} from './content/tab-settings/rows-settings/row-layout/dashboard-row-layout.component';
import {DropdownModule} from '../../dropdown/dropdown.module';
import {LayoutTemplateColumnsPipe} from './pipes/layout-template-columns.pipe';
import {IsLayoutSelectedInRowPipe} from './pipes/is-layout-selected-in-row.pipe';
import {FilterValidCellsPipe} from './pipes/filter-valid-cells.pipe';
import {FindCellByCoordinatesPipe} from './pipes/find-cell-by-coordinates.pipe';
import {SelectModule} from '../../select/select.module';
import {DashboardViewConfigComponent} from './content/tab-settings/cell-settings/view/dashboard-view-config.component';
import {DashboardImageConfigComponent} from './content/tab-settings/cell-settings/image/dashboard-image-config.component';
import {DashboardActionsConfigComponent} from './content/tab-settings/cell-settings/actions/dashboard-actions-config.component';
import {DashboardCellPreviewComponent} from './content/tab-settings/rows-settings/row-settings/cell/dashboard-cell-preview.component';
import {PipesModule} from '../../pipes/pipes.module';
import {DashboardActionConfigComponent} from './content/tab-settings/cell-settings/actions/action/dashboard-action-config.component';
import {PickerModule} from '../../picker/picker.module';
import {IsTabSelectedPipe} from './pipes/is-tab-selected.pipe';

@NgModule({
  declarations: [
    TabsSettingsModalComponent,
    TabsSettingsContentComponent,
    IsLayoutSelectedInRowPipe,
    IsTabDefaultPipe,
    DashboardTabComponent,
    DashboardTabSettingsComponent,
    DashboardRowsSettingsComponent,
    DashboardCellSettingsComponent,
    DashboardRowSettingsComponent,
    DashboardRowLayoutComponent,
    LayoutTemplateColumnsPipe,
    FilterValidCellsPipe,
    FindCellByCoordinatesPipe,
    DashboardViewConfigComponent,
    DashboardImageConfigComponent,
    DashboardActionsConfigComponent,
    DashboardCellPreviewComponent,
    DashboardActionConfigComponent,
    IsTabSelectedPipe,
  ],
  imports: [
    CommonModule,
    ModalWrapperModule,
    FormsModule,
    InputModule,
    DragDropModule,
    DropdownModule,
    SelectModule,
    PipesModule,
    PickerModule,
  ],
})
export class TabsSettingsModalModule {}
