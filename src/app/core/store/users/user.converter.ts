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
import {UserDto} from '../../dto';
import {DefaultWorkspaceDto} from '../../dto/default-workspace.dto';
import {NotificationsSettingsDto, UserHintsDto, UserOnboardingDto} from '../../dto/user.dto';
import {NotificationChannelMap} from '../../model/notification-channel';
import {NotificationFrequencyMap} from '../../model/notification-frequency';
import {UserNotificationTypeMap} from '../../model/user-notification';
import {DefaultWorkspace, NotificationsSettings, User, UserHints, UserOnboarding} from './user';

export function convertDefaultWorkspaceDtoToModel(dto: DefaultWorkspaceDto): DefaultWorkspace {
  return {
    organizationId: dto.organizationId,
    projectId: dto.projectId,
    organizationCode: dto.organizationCode,
    projectCode: dto.projectCode,
  };
}

export function convertDefaultWorkspaceModelToDto(model: DefaultWorkspace): DefaultWorkspaceDto {
  return {
    organizationId: model.organizationId,
    projectId: model.projectId,
    organizationCode: model.organizationCode,
    projectCode: model.projectCode,
  };
}

export function convertUserDtoToModel(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    organizations: dto.organizations,
    defaultWorkspace: dto.defaultWorkspace ? convertDefaultWorkspaceDtoToModel(dto.defaultWorkspace) : null,
    agreement: dto.agreement,
    agreementDate: dto.agreementDate ? new Date(dto.agreementDate) : undefined,
    newsletter: dto.newsletter,
    wizardDismissed: dto.wizardDismissed,
    lastLoggedIn: dto.lastLoggedIn ? new Date(dto.lastLoggedIn) : undefined,
    referral: dto.referral,
    language: dto.language,
    affiliatePartner: dto.affiliatePartner,
    emailVerified: dto.emailVerified,
    notifications: convertNotificationsFromDto(dto.notifications),
    hints: convertUserHintsDtoToModel(dto.hints),
    onboarding: convertUserOnboardingDtoToModel(dto.onboarding),
  };
}

export function convertUserModelToDto(user: Partial<User>): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizations: user.organizations,
    agreement: user.agreement,
    newsletter: user.newsletter,
    wizardDismissed: user.wizardDismissed,
    referral: user.referral,
    language: user.language,
    affiliatePartner: user.affiliatePartner,
    emailVerified: user.emailVerified,
    notifications: convertNotificationsToDto(user.notifications),
    hints: convertUserHintsModelToDto(user.hints),
  };
}

export function convertNotificationsFromDto(notifications: NotificationsSettingsDto): NotificationsSettings {
  const settings = (notifications?.settings || []).map(notification => ({
    notificationType: UserNotificationTypeMap[notification.notificationType],
    notificationFrequency: NotificationFrequencyMap[notification.notificationFrequency],
    notificationChannel: NotificationChannelMap[notification.notificationChannel],
  }));
  return {settings, language: notifications?.language};
}

export function convertNotificationsToDto(notifications: NotificationsSettings): NotificationsSettingsDto {
  const settings = (notifications?.settings || []).map(notification => ({
    notificationType: notification.notificationType?.toString(),
    notificationFrequency: notification.notificationFrequency?.toString(),
    notificationChannel: notification.notificationChannel?.toString(),
  }));
  return {settings, language: notifications?.language};
}

export function convertUserHintsModelToDto(hints: UserHints): UserHintsDto {
  return {...hints};
}

export function convertUserHintsDtoToModel(hints: UserHintsDto): UserHints {
  return {...hints};
}

export function convertUserOnboardingModelToDto(model: UserOnboarding): UserOnboardingDto {
  return {...model};
}

export function convertUserOnboardingDtoToModel(dto: UserOnboardingDto): UserOnboarding {
  return {...dto};
}
