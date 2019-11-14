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
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../../../shared/shared.module';
import {CalendarPerspectiveComponent} from './calendar-perspective.component';
import {CalendarPerspectiveRoutingModule} from './calendar-perspective-routing.module';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT,
} from 'angular-calendar';
import {CalendarConfigComponent} from './config/calendar-config.component';
import {CalendarPipesModule} from './pipes/calendar-pipes.module';
import {CalendarVisualizationComponent} from './events/visualization/calendar-visualization.component';
import {CalendarHeaderComponent} from './events/header/calendar-header.component';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {CalendarCollectionConfigComponent} from './config/collection-config/calendar-collection-config.component';
import {adapterFactory} from 'angular-calendar/date-adapters/moment';
import * as moment from 'moment';
import {CalendarEventsComponent} from './events/calendar-events.component';
import {CalendarEventDetailModalComponent} from './modal/calendar-event-detail-modal.component';
import {ModalModule as NgxModalModule} from 'ngx-bootstrap';

export function momentAdapterFactory() {
  return adapterFactory(moment);
}

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    PopoverModule,
    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: momentAdapterFactory,
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter,
        },
      }
    ),
    CalendarPerspectiveRoutingModule,
    CalendarPipesModule,
    NgxModalModule.forRoot(),
  ],
  declarations: [
    CalendarPerspectiveComponent,
    CalendarConfigComponent,
    CalendarVisualizationComponent,
    CalendarHeaderComponent,
    CalendarCollectionConfigComponent,
    CalendarEventsComponent,
    CalendarEventDetailModalComponent,
  ],
  entryComponents: [CalendarPerspectiveComponent, CalendarEventDetailModalComponent],
  exports: [CalendarPerspectiveComponent],
  providers: [
    {
      provide: MOMENT,
      useValue: moment,
    },
  ],
})
export class CalendarPerspectiveModule {}
