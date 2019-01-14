/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {SharedModule} from '../../../shared/shared.module';
import {CalendarPerspectiveComponent} from './calendar-perspective.component';
import {CalendarPerspectiveRoutingModule} from './calendar-perspective-routing.module';
import {CalendarModule, DateAdapter} from 'angular-calendar';
import {adapterFactory} from 'angular-calendar/date-adapters/date-fns';
import {UtilsModule} from './utils/module';
import {ContextMenuModule} from 'ngx-contextmenu';
import {FormsModule} from '@angular/forms';
import {NgbModalModule, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatDialogModule} from '@angular/material';
import {CalendarConfigComponent} from './calendar-config/calendar-config.component';
import {CalendarPipesModule} from './pipes/calendar-pipes.module';
import {CalendarVisualizationComponent} from './calendar-visualization/calendar-visualization.component';

@NgModule({
  imports: [
    //not sure
    SharedModule,
    CommonModule,
    FormsModule,
    NgbModalModule,
    NgbModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
    CalendarPerspectiveRoutingModule,
    ContextMenuModule.forRoot({
      useBootstrap4: true,
    }),
    UtilsModule,
    MatDialogModule,
    CalendarPipesModule,
  ],
  declarations: [CalendarPerspectiveComponent, CalendarConfigComponent, CalendarVisualizationComponent],
  entryComponents: [CalendarPerspectiveComponent],
  exports: [CalendarPerspectiveComponent],
})
export class CalendarPerspectiveModule {}
