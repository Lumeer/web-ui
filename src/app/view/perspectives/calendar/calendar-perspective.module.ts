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
import {FormsModule} from '@angular/forms';

import {FullCalendarModule} from '@fullcalendar/angular';
import {PopoverModule} from 'ngx-bootstrap/popover';

import {ModalModule} from '../../../shared/modal/modal.module';
import {SharedModule} from '../../../shared/shared.module';
import {CalendarPerspectiveRoutingModule} from './calendar-perspective-routing.module';
import {CalendarPerspectiveComponent} from './calendar-perspective.component';
import {CalendarConfigComponent} from './config/calendar-config.component';
import {CalendarStemConfigComponent} from './config/stem-config/calendar-stem-config.component';
import {CalendarEventsComponent} from './events/calendar-events.component';
import {CalendarVisualizationComponent} from './events/visualization/calendar-visualization.component';
import {CalendarPipesModule} from './pipes/calendar-pipes.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    PopoverModule,
    CalendarPerspectiveRoutingModule,
    CalendarPipesModule,
    ModalModule,
    FullCalendarModule,
  ],
  declarations: [
    CalendarPerspectiveComponent,
    CalendarConfigComponent,
    CalendarStemConfigComponent,
    CalendarEventsComponent,
    CalendarVisualizationComponent,
  ],
  exports: [CalendarPerspectiveComponent],
})
export class CalendarPerspectiveModule {}
