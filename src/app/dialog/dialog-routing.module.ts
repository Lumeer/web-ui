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
import {RouterModule, Routes} from '@angular/router';
import {CreateLinkDialogComponent} from './create-link/create-link-dialog.component';
import {DialogPath} from './dialog-path';
import {FeedbackDialogComponent} from './dialog/feedback-dialog.component';
import {ShareViewDialogComponent} from './share-view/share-view-dialog.component';
import {PlayVideoComponent} from './play-video/play-video.component';
import {CalendarEventDialogComponent} from './calendar-event/calendar-event-dialog.component';

const routes: Routes = [
  {
    path: `${DialogPath.CREATE_LINK}/:linkCollectionIds`,
    component: CreateLinkDialogComponent,
    outlet: 'dialog',
  },
  {
    path: DialogPath.FEEDBACK,
    component: FeedbackDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.SHARE_VIEW}/:viewCode`,
    component: ShareViewDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.PLAY_VIDEO}/:videoId`,
    component: PlayVideoComponent,
    outlet: 'dialog',
    data: {modalDialogClass: 'modal-lg'},
  },
  {
    path: `${DialogPath.CALENDAR_EVENT}/:calendarId/:time`,
    component: CalendarEventDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.CALENDAR_EVENT}/:calendarId/:time/:documentId/:stemIndex`,
    component: CalendarEventDialogComponent,
    outlet: 'dialog',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DialogRoutingModule {}
