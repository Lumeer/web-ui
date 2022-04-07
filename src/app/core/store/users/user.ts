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

import {PaymentStats} from '../organizations/payment/payment';
import {UserNotificationType} from '../../model/user-notification';
import {NotificationChannel} from '../../model/notification-channel';
import {NotificationFrequency} from '../../model/notification-frequency';
import {Team} from '../teams/team';

export interface User {
  id?: string;
  name?: string;
  email: string;
  organizations?: string[];
  teams?: Team[];
  defaultWorkspace?: DefaultWorkspace;
  agreement?: boolean;
  agreementDate?: Date;
  newsletter?: boolean;
  wizardDismissed?: boolean;
  lastLoggedIn?: Date;
  referral?: string;
  language?: string;
  referrals?: PaymentStats;
  affiliatePartner?: boolean;
  emailVerified?: boolean;
  notifications?: NotificationsSettings;
  hints?: UserHints;
  onboarding?: UserOnboarding;

  correlationId?: string;
}

export interface UserOnboarding {
  template?: string;
  invitedUsers?: number;
  videoShowed?: boolean;
  videoPlayed?: boolean;
  helpOpened?: boolean;
  videoPlayedSeconds?: number;
}

export interface DefaultWorkspace {
  organizationCode?: string;
  organizationId: string;
  projectCode?: string;
  projectId: string;
}

export enum UserHintsKeys {
  applicationHints = 'applicationHints',
  organizationTeamsHintDismissed = 'organizationTeamsHintDismissed',
  projectTeamsHintDismissed = 'projectTeamsHintDismissed',
  viewTeamsHintDismissed = 'viewTeamsHintDismissed',

  logoHintDismissed = 'logoHintDismissed',
  organizationMenuHintDismissed = 'organizationMenuHintDismissed',
  projectMenuHintDismissed = 'projectMenuHintDismissed',

  tableSettingsHintDismissed = 'tableSettingsHintDismissed',

  tableWorkflowHintDismissed = 'tableWorkflowHintDismissed',
  tableAttributesHintDismissed = 'tableAttributesHintDismissed',
  tableRulesHintDismissed = 'tableRulesHintDismissed',

  tasksHintDismissed = 'tasksHintDismissed',
  viewsHintDismissed = 'viewsHintDismissed',
  tablesHintDismissed = 'tablesHintDismissed',
  dashboardSettingsHintDismissed = 'dashboardSettingsHintDismissed',

  perspectiveHintDismissed = 'perspectiveHintDismissed',
  saveViewHintDismissed = 'saveViewHintDismissed',
  shareViewHintDismissed = 'shareViewHintDismissed',

  searchHintDismissed = 'searchHintDismissed',

  inviteUsersHintDismissed = 'inviteUsersHintDismissed',
  notificationsHintDismissed = 'notificationsHintDismissed',

  addNewTaskHintDismissed = 'addNewTaskHintDismissed',
  pinTaskHintDismissed = 'pinTaskHintDismissed',
  detailTaskHintDismissed = 'detailTaskHintDismissed',

  deleteSampleDataHintDismissed = 'deleteSampleDataHintDismissed',
}

export interface UserHints {
  applicationHints?: boolean;
  organizationTeamsHintDismissed?: boolean;
  projectTeamsHintDismissed?: boolean;
  viewTeamsHintDismissed?: boolean;

  logoHintDismissed?: boolean;
  organizationMenuHintDismissed?: boolean;
  projectMenuHintDismissed?: boolean;

  tableSettingsHintDismissed?: boolean;

  tableWorkflowHintDismissed?: boolean;
  tableAttributesHintDismissed?: boolean;
  tableRulesHintDismissed?: boolean;

  tasksHintDismissed?: boolean;
  viewsHintDismissed?: boolean;
  tablesHintDismissed?: boolean;
  dashboardSettingsHintDismissed?: boolean;

  perspectiveHintDismissed?: boolean;
  saveViewHintDismissed?: boolean;
  shareViewHintDismissed?: boolean;

  searchHintDismissed?: boolean;

  inviteUsersHintDismissed?: boolean;
  notificationsHintDismissed?: boolean;

  addNewTaskHintDismissed?: boolean;
  pinTaskHintDismissed?: boolean;
  detailTaskHintDismissed?: boolean;

  deleteSampleDataHintDismissed?: boolean;
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
