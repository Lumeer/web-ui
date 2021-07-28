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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {AttributesSettingsComponent} from './attributes-settings.component';
import {AttributesSettingsContentComponent} from './content/attributes-settings-content.component';
import {PipesModule} from '../../pipes/pipes.module';
import {AttributeSettingsComponent} from './content/settings/attribute-settings.component';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {PresenterModule} from '../../presenter/presenter.module';
import {CreateAttributesSettingsOrderPipe} from './pipes/create-attributes-settings-order.pipe';
import {CountShowedAttributesPipe} from './pipes/count-showed-attributes.pipe';
import {ResourceAttributesSettingsPipe} from './pipes/resource-attributes-settings.pipe';

@NgModule({
  declarations: [
    AttributesSettingsComponent,
    AttributesSettingsContentComponent,
    AttributeSettingsComponent,
    CreateAttributesSettingsOrderPipe,
    CountShowedAttributesPipe,
    ResourceAttributesSettingsPipe,
  ],
  imports: [CommonModule, PipesModule, DragDropModule, AccordionModule, PresenterModule],
  exports: [AttributesSettingsComponent, ResourceAttributesSettingsPipe],
})
export class AttributesSettingsModule {}
