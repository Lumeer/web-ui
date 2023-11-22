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

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {DropdownModule} from '../../dropdown/dropdown.module';
import {InputModule} from '../../input/input.module';
import {LayoutModule} from '../../layout/layout.module';
import {PickerModule} from '../../picker/picker.module';
import {PipesModule} from '../../pipes/pipes.module';
import {SelectModule} from '../../select/select.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {DashboardActionConfigComponent} from './content/tab-settings/cell-settings/actions/action/dashboard-action-config.component';
import {DashboardActionsConfigComponent} from './content/tab-settings/cell-settings/actions/dashboard-actions-config.component';
import {DashboardCellSettingsComponent} from './content/tab-settings/cell-settings/dashboard-cell-settings.component';
import {DashboardImageConfigComponent} from './content/tab-settings/cell-settings/image/dashboard-image-config.component';
import {DashboardCellTitleComponent} from './content/tab-settings/cell-settings/title/dashboard-cell-title.component';
import {DashboardViewConfigComponent} from './content/tab-settings/cell-settings/view/dashboard-view-config.component';
import {DashboardTabSettingsComponent} from './content/tab-settings/dashboard-tab-settings.component';
import {DashboardRowsSettingsComponent} from './content/tab-settings/rows-settings/dashboard-rows-settings.component';
import {DashboardCellPreviewComponent} from './content/tab-settings/rows-settings/row-settings/cell/dashboard-cell-preview.component';
import {DashboardRowSettingsComponent} from './content/tab-settings/rows-settings/row-settings/dashboard-row-settings.component';
import {DashboardTabBadgeComponent} from './content/tab/dashboard-tab-badge.component';
import {TabsSettingsContentComponent} from './content/tabs-settings-content.component';
import {FilterValidCellsPipe} from './pipes/filter-valid-cells.pipe';
import {FindCellByCoordinatesPipe} from './pipes/find-cell-by-coordinates.pipe';
import {IsTabDefaultPipe} from './pipes/is-tab-default.pipe';
import {IsTabSelectedPipe} from './pipes/is-tab-selected.pipe';
import {SelectedLayoutInRowPipe} from './pipes/selected-layout-in-row.pipe';
import {TabsSettingsSecondaryInfoPipe} from './pipes/tabs-settings-secondary-info.pipe';
import {TabsSettingsModalComponent} from './tabs-settings-modal.component';

@NgModule({
  declarations: [
    TabsSettingsModalComponent,
    TabsSettingsContentComponent,
    SelectedLayoutInRowPipe,
    IsTabDefaultPipe,
    DashboardTabBadgeComponent,
    DashboardTabSettingsComponent,
    DashboardRowsSettingsComponent,
    DashboardCellSettingsComponent,
    DashboardRowSettingsComponent,
    FilterValidCellsPipe,
    FindCellByCoordinatesPipe,
    DashboardViewConfigComponent,
    DashboardImageConfigComponent,
    DashboardActionsConfigComponent,
    DashboardCellPreviewComponent,
    DashboardActionConfigComponent,
    IsTabSelectedPipe,
    TabsSettingsSecondaryInfoPipe,
    DashboardCellTitleComponent,
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
    TooltipModule,
    LayoutModule,
  ],
  exports: [FilterValidCellsPipe],
})
export class TabsSettingsModalModule {}
