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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';

import {PickerModule} from '../../picker/picker.module';
import {ModalWrapperModule} from '../wrapper/modal-wrapper.module';
import {PipesModule} from '../../pipes/pipes.module';
import {PresenterModule} from '../../presenter/presenter.module';
import {AttributeTypeModalComponent} from './attribute-type-modal.component';
import {ConstraintConfigFormComponent} from './form/constraint-config/constraint-config-form.component';
import {AttributeTypeFormComponent} from './form/attribute-type-form.component';
import {AddressConstraintConfigFormComponent} from './form/constraint-config/address/address-constraint-config-form.component';
import {CoordinatesConstraintConfigFormComponent} from './form/constraint-config/coordinates/coordinates-constraint-config-form.component';
import {DatetimeConstraintConfigFormComponent} from './form/constraint-config/datetime/datetime-constraint-config-form.component';
import {DurationConstraintConfigFormComponent} from './form/constraint-config/duration/duration-constraint-config-form.component';
import {NumberConstraintConfigFormComponent} from './form/constraint-config/number/number-constraint-config-form.component';
import {PercentageConstraintConfigFormComponent} from './form/constraint-config/percentage/percentage-constraint-config-form.component';
import {SelectConstraintConfigFormComponent} from './form/constraint-config/select/select-constraint-config-form.component';
import {TextConstraintConfigFormComponent} from './form/constraint-config/text/text-constraint-config-form.component';
import {UserConstraintConfigFormComponent} from './form/constraint-config/user/user-constraint-config-form.component';
import {DateTimeModule} from '../../date-time/date-time.module';
import {DurationConstraintConfigFormConversionsComponent} from './form/constraint-config/duration/conversion/duration-constraint-config-form-conversions.component';
import {DurationConstraintUnitEditablePipe} from './form/constraint-config/duration/conversion/duration-constraint-unit-editable.pipe';
import {DurationConstraintUnitMaxValuePipe} from './form/constraint-config/duration/conversion/duration-constraint-unit-max-value.pipe';
import {AttributeTypeSelectComponent} from './form/select/attribute-type-select.component';
import {SelectConstraintOptionsFormComponent} from './form/constraint-config/select/options/select-constraint-options-form.component';
import {SelectModule} from '../../select/select.module';
import {DirectivesModule} from '../../directives/directives.module';
import {LinkConstraintConfigFormComponent} from './form/constraint-config/link/link-constraint-config-form.component';
import {ActionConstraintConfigFormComponent} from './form/constraint-config/action/action-constraint-config-form.component';
import {ActionConstraintConditionsFormComponent} from './form/constraint-config/action/conditions/action-constraint-conditions-form.component';
import {ActionConstraintConditionFormComponent} from './form/constraint-config/action/conditions/condition/action-constraint-condition-form.component';
import {FilterPreviewModule} from '../../builder/filter-preview/filter-preview.module';
import {FilterBuilderModule} from '../../builder/filter-builder/filter-builder.module';
import {ActionConstraintPermissionsFormComponent} from './form/constraint-config/action/permissions/action-constraint-permissions-form.component';
import {CollectionSettingsPathPipe} from './form/constraint-config/action/pipes/collection-settings-path.pipe';
import {RouterModule} from '@angular/router';
import {ActionConstraintConfigEmptyComponent} from './form/constraint-config/action/empty/action-constraint-config-empty.component';
import {ActionConstraintConfirmationFormComponent} from './form/constraint-config/action/confirmation/action-constraint-confirmation-form.component';
import {InputModule} from '../../input/input.module';

@NgModule({
  declarations: [
    AddressConstraintConfigFormComponent,
    CoordinatesConstraintConfigFormComponent,
    DatetimeConstraintConfigFormComponent,
    DurationConstraintConfigFormComponent,
    DurationConstraintConfigFormConversionsComponent,
    DurationConstraintUnitEditablePipe,
    DurationConstraintUnitMaxValuePipe,
    NumberConstraintConfigFormComponent,
    PercentageConstraintConfigFormComponent,
    SelectConstraintConfigFormComponent,
    SelectConstraintOptionsFormComponent,
    TextConstraintConfigFormComponent,
    UserConstraintConfigFormComponent,
    ConstraintConfigFormComponent,
    AttributeTypeFormComponent,
    AttributeTypeSelectComponent,
    AttributeTypeModalComponent,
    LinkConstraintConfigFormComponent,
    ActionConstraintConfigFormComponent,
    ActionConstraintConditionsFormComponent,
    ActionConstraintConditionFormComponent,
    ActionConstraintPermissionsFormComponent,
    CollectionSettingsPathPipe,
    ActionConstraintConfigEmptyComponent,
    ActionConstraintConfirmationFormComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalWrapperModule,
    PickerModule,
    DragDropModule,
    SelectModule,
    DateTimeModule,
    PresenterModule,
    PipesModule,
    DirectivesModule,
    FilterPreviewModule,
    FilterBuilderModule,
    RouterModule,
    InputModule,
  ],
  exports: [AttributeTypeModalComponent],
})
export class AttributeTypeModalModule {}
