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

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {ResourceAttributesModule} from '../shared/attributes/resource-attributes.module';
import {DirectivesModule} from '../shared/directives/directives.module';
import {InputModule} from '../shared/input/input.module';
import {PipesModule} from '../shared/pipes/pipes.module';
import {PresenterModule} from '../shared/presenter/presenter.module';
import {ResourceActivityModule} from '../shared/resource/activity/resource-activity.module';
import {RulesModule} from '../shared/rules/rules.module';
import {TopPanelModule} from '../shared/top-panel/top-panel.module';
import {LinkTypeRoutingModule} from './link-type-routing.module';
import {LinkTypeSettingsGuard} from './link-type-settings.guard';
import {LinkTypeTabGuard} from './link-type-tab.guard';
import {LinkTypeHeaderComponent} from './settings/header/link-type-header.component';
import {LinkTypeSettingsComponent} from './settings/link-type-settings.component';
import {LinkTypeActivityComponent} from './settings/tab/activity/link-type-activity.component';
import {LinkTypeAttributesComponent} from './settings/tab/attributes/link-type-attributes.component';
import {LinkTypeCollectionComponent} from './settings/tab/collections/collection/link-type-collection.component';
import {LinkTypeCollectionsComponent} from './settings/tab/collections/link-type-collections.component';
import {LinkTypeRulesComponent} from './settings/tab/rules/link-type-rules.component';

@NgModule({
  imports: [
    CommonModule,
    LinkTypeRoutingModule,
    TooltipModule,
    InputModule,
    ResourceActivityModule,
    TopPanelModule,
    ResourceAttributesModule,
    RulesModule,
    PipesModule,
    DirectivesModule,
    PresenterModule,
  ],
  declarations: [
    LinkTypeSettingsComponent,
    LinkTypeActivityComponent,
    LinkTypeHeaderComponent,
    LinkTypeAttributesComponent,
    LinkTypeRulesComponent,
    LinkTypeCollectionsComponent,
    LinkTypeCollectionComponent,
  ],
  providers: [LinkTypeSettingsGuard, LinkTypeTabGuard],
})
export class LinkTypeModule {}
