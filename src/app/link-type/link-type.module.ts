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

import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {SharedModule} from '../shared/shared.module';
import {LinkTypeSettingsGuard} from './link-type-settings.guard';
import {LinkTypeTabGuard} from './link-type-tab.guard';
import {LinkTypeSettingsComponent} from './settings/link-type-settings.component';
import {LinkTypeRoutingModule} from './link-type-routing.module';
import {LinkTypeActivityComponent} from './settings/tab/activity/link-type-activity.component';
import {LinkTypeHeaderComponent} from './settings/header/link-type-header.component';
import {LinkTypeAttributesComponent} from './settings/tab/attributes/link-type-attributes.component';
import {ResourceAttributesModule} from '../shared/attributes/resource-attributes.module';

@NgModule({
  imports: [SharedModule, LinkTypeRoutingModule, TooltipModule, ResourceAttributesModule],
  declarations: [
    LinkTypeSettingsComponent,
    LinkTypeActivityComponent,
    LinkTypeHeaderComponent,
    LinkTypeAttributesComponent,
  ],
  providers: [LinkTypeSettingsGuard, LinkTypeTabGuard],
})
export class LinkTypeModule {}
