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
import {RouterModule} from '@angular/router';
import {DragDropModule} from '@angular/cdk/drag-drop';

import {SharedModule} from '../../../shared/shared.module';
import {SearchBoxModule} from '../../../shared/top-panel/search-box/search-box.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {SearchTasksModule} from '../dashboard/search-tasks/search-tasks.module';
import {SearchPerspectiveRoutingModule} from './search-perspective-routing.module';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {CreateDocumentModalModule} from '../../../shared/modal/create-document/create-document-modal.module';
import {SearchPerspectiveRedirectGuard} from './search-perspective-redirect.guard';
import {DashboardModule} from '../dashboard/dashboard.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  imports: [
    RouterModule,
    SharedModule,
    SearchBoxModule,
    WarningMessageModule,
    SearchPerspectiveRoutingModule,
    SearchTasksModule,
    CreateDocumentModalModule,
    DragDropModule,
    DashboardModule,
    TooltipModule,
  ],
  declarations: [SearchPerspectiveComponent],
  exports: [SearchPerspectiveComponent],
  providers: [SearchPerspectiveRedirectGuard],
})
export class SearchPerspectiveModule {}
