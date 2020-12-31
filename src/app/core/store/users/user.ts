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

import {Group} from '../groups/group';
import {PaymentStats} from '../organizations/payment/payment';
import {UserNotificationType} from '../../model/user-notification';
import {NotificationChannel} from '../../model/notification-channel';
import {NotificationFrequency} from '../../model/notification-frequency';

export interface User {
  id?: string;
  name?: string;
  email: string;
  groupsMap: Record<string, string[]>;
  groups?: Group[];
  defaultWorkspace?: DefaultWorkspace;
  agreement?: boolean;
  agreementDate?: Date;
  newsletter?: boolean;
  wizardDismissed?: boolean;
  lastLoggedIn?: Date;
  referral?: string;
  referrals?: PaymentStats;
  affiliatePartner?: boolean;
  emailVerified?: boolean;
  notifications?: NotificationsSettings;
  hints?: UserHints;

  correlationId?: string;
}

export interface DefaultWorkspace {
  organizationCode?: string;
  organizationId: string;
  projectCode?: string;
  projectId: string;
}

export const enum UserHintsKeys {
  applicationHints = 'applicationHints',
}

export interface UserHints {
  applicationHints?: boolean;
}

export interface NotificationsSettings {
  settings?: NotificationSettings[];
  language?: string;
}

export interface NotificationSettings {
  notificationType?: UserNotificationType;
  notificationChannel?: NotificationChannel;
  notificationFrequency?: NotificationFrequency;
}
