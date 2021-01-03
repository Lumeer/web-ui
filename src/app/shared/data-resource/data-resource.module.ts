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
import {MatMenuModule} from '@angular/material/menu';
import {InputModule} from '../input/input.module';
import {PipesModule} from '../pipes/pipes.module';
import {DataInputModule} from '../data-input/data-input.module';
import {DocumentDetailHeaderComponent} from './detail/header/document-detail-header.component';
import {AttributeTypeModalModule} from '../modal/attribute-type/attribute-type-modal.module';
import {AttributeFunctionModalModule} from '../modal/attribute-function/attribute-function-modal.module';
import {ColorPickerModule} from 'ngx-color-picker';
import {DefaultDataRowPipe} from './detail/header/default-data-row.pipe';
import {PresenterModule} from '../presenter/presenter.module';
import {DataResourceDataComponent} from './detail/data/data-resource-data.component';
import {DataResourceDetailComponent} from './detail/data-resource-detail.component';
import {DataResourceDataRowIconsComponent} from './detail/data/row/icons/data-resource-data-row-icons.component';
import {DataResourceDataRowComponent} from './detail/data/row/data-resource-data-row.component';
import {DirectivesModule} from '../directives/directives.module';
import {DetailTabsComponent} from './detail/detail-tabs/detail-tabs.component';
import {LinksModule} from '../links/links.module';
import {ResourceCommentsModule} from '../resource-comments/resource-comments.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {LinksToolbarComponent} from './detail/links-toolbar/links-toolbar.component';

@NgModule({
  imports: [
    CommonModule,
    DataInputModule,
    InputModule,
    PipesModule,
    DirectivesModule,
    ColorPickerModule,
    InputModule,
    AttributeTypeModalModule,
    AttributeFunctionModalModule,
    PresenterModule,
    LinksModule,
    ResourceCommentsModule,
    TooltipModule,
    MatMenuModule,
  ],
  declarations: [
    DataResourceDetailComponent,
    DocumentDetailHeaderComponent,
    DataResourceDataComponent,
    DataResourceDataRowComponent,
    DataResourceDataRowIconsComponent,
    DefaultDataRowPipe,
    DetailTabsComponent,
    LinksToolbarComponent,
  ],
  exports: [DataResourceDetailComponent],
})
export class DataResourceModule {}
