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
import {NotificationsMenuDropdownComponent} from './content/dropdown/notifications-menu-dropdown.component';
import {DropdownModule} from '../../../dropdown/dropdown.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {NotificationItemComponent} from './content/dropdown/notification-item/notification-item.component';
import {NotificationTextComponent} from './content/dropdown/notification-text/notification-text.component';
import {NotificationIconComponent} from './content/dropdown/notification-icon/notification-icon.component';
import {NotificationPathComponent} from './content/dropdown/notification-path/notification-path.component';
import {RedDotModule} from '../../../red-dot/red-dot.module';

@NgModule({
  imports: [CommonModule, PipesModule, RouterModule, DropdownModule, TooltipModule.forRoot(), RedDotModule],
  declarations: [
    NotificationsMenuComponent,
    NotificationsMenuContentComponent,
    ValidNotificationFilterPipe,
    NotificationsMenuDropdownComponent,
    NotificationItemComponent,
    NotificationTextComponent,
    NotificationIconComponent,
    NotificationIconComponent,
    NotificationPathComponent,
  ],
  exports: [NotificationsMenuComponent],
})
export class NotificationsMenuModule {}
