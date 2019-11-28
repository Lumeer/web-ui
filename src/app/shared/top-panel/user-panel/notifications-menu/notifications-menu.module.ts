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
import {RouterModule} from '@angular/router';
import {PipesModule} from '../../../pipes/pipes.module';
import {NotificationsMenuComponent} from './notifications-menu.component';
import {NotificationsMenuContentComponent} from './content/notifications-menu-content.component';
import {ValidNotificationFilterPipe} from './valid-notification-filter.pipe';
import {NotificationOrganizationComponent} from './content/dropdown/organization/notification-organization.component';
import {NotificationProjectComponent} from './content/dropdown/project/notification-project.component';
import {NotificationCollectionComponent} from './content/dropdown/collection/notification-collection.component';
import {NotificationViewComponent} from './content/dropdown/view/notification-view.component';
import {NotificationsMenuDropdownComponent} from './content/dropdown/notifications-menu-dropdown.component';
import {DropdownModule} from '../../../dropdown/dropdown.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  imports: [CommonModule, PipesModule, RouterModule, DropdownModule, TooltipModule.forRoot()],
  declarations: [
    NotificationsMenuComponent,
    NotificationsMenuContentComponent,
    ValidNotificationFilterPipe,
    NotificationOrganizationComponent,
    NotificationProjectComponent,
    NotificationCollectionComponent,
    NotificationViewComponent,
    NotificationsMenuDropdownComponent,
  ],
  exports: [NotificationsMenuComponent],
})
export class NotificationsMenuModule {}
