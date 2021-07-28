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
import {NotificationSettingsComponent} from './notification-settings/notification-settings.component';
import {SelectModule} from '../select/select.module';
import {UserSettingsComponent} from './user-settings/user-settings.component';
import {GravatarModule} from 'ngx-gravatar';
import {InputModule} from '../input/input.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [NotificationSettingsComponent, UserSettingsComponent],
  imports: [CommonModule, SelectModule, GravatarModule, InputModule, TooltipModule],
  exports: [NotificationSettingsComponent, UserSettingsComponent],
})
export class UserSettingsModule {}
