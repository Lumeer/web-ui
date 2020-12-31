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

import {DefaultWorkspaceDto} from './default-workspace.dto';
import {NotificationSettings} from '../store/users/user';
import {UserNotificationType} from '../model/user-notification';
import {NotificationChannel} from '../model/notification-channel';
import {NotificationFrequency} from '../model/notification-frequency';

export interface UserDto {
  id?: string;
  name?: string;
  email: string;
  groups: {[organizationId: string]: string[]};
  defaultWorkspace?: DefaultWorkspaceDto;
  agreement?: boolean;
  agreementDate?: number;
  newsletter?: boolean;
  wizardDismissed?: boolean;
  lastLoggedIn?: number;
  referral?: string;
  affiliatePartner?: boolean;
  emailVerified?: boolean;
  notifications?: NotificationsSettingsDto;
  hints?: UserHintsDto;
}

export type UserHintsDto = {[key: string]: any};

export interface NotificationsSettingsDto {
  settings?: NotificationSettingsDto[];
  language?: string;
}

export interface NotificationSettingsDto {
  notificationType?: string;
  notificationChannel?: string;
  notificationFrequency?: string;
}
