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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NotificationSettings, User} from '../../../core/store/users/user';
import {UserNotificationGroupType, userNotificationGroupTypes} from '../../../core/model/user-notification';
import {NotificationChannel} from '../../../core/model/notification-channel';
import {NotificationFrequency} from '../../../core/model/notification-frequency';
import {SelectItem2Model} from '../../select/select-item2/select-item2.model';
import {availableLanguages, LanguageCode} from '../../top-panel/user-panel/user-menu/language';

@Component({
  selector: 'notification-settings',
  templateUrl: './notification-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsComponent implements OnInit {
  @Input()
  public user: User;

  @Output()
  public settingsChange = new EventEmitter<NotificationSettings[]>();

  @Output()
  public languageChange = new EventEmitter<LanguageCode>();

  public notificationsGroups: UserNotificationGroupType[] = Object.values(UserNotificationGroupType);
  public notificationsGroupsValues: Record<string, boolean>;
  public language: LanguageCode;
  public languageSelectItems: SelectItem2Model[];

  constructor() {
    this.languageSelectItems = availableLanguages.map(language => ({
      id: language.code,
      icons: [language.icon],
      value: language.translatedName,
    }));
  }

  public ngOnInit() {
    this.notificationsGroupsValues = convertSettingsToGroups(
      this.user?.notifications?.settings,
      NotificationChannel.Email
    );
    this.language = <LanguageCode>this.user.notifications?.language || LanguageCode.EN;
  }

  public onCheckedChange(group: UserNotificationGroupType, checked: boolean) {
    this.notificationsGroupsValues[group] = checked;
    const emailSettings = convertGroupsToSettings(this.notificationsGroupsValues, NotificationChannel.Email);
    const otherSettings =
      this.user?.notifications?.settings?.filter(
        setting => setting.notificationChannel !== NotificationChannel.Email
      ) || [];
    this.settingsChange.emit([...emailSettings, ...otherSettings]);
  }

  public onLanguageSelect(model: SelectItem2Model[]) {
    this.language = model[0].id;
    this.languageChange.emit(this.language);
  }
}

function convertSettingsToGroups(
  settings: NotificationSettings[],
  channel: NotificationChannel
): Record<string, boolean> {
  return Object.values(UserNotificationGroupType).reduce((map, group) => {
    const notificationTypes = userNotificationGroupTypes[group] || [];
    const notification = settings?.find(
      n => notificationTypes.includes(n.notificationType) && n.notificationChannel === channel
    );
    map[group] = !!notification;
    return map;
  }, {});
}

function convertGroupsToSettings(
  settings: Record<string, boolean>,
  notificationChannel: NotificationChannel
): NotificationSettings[] {
  return Object.keys(settings || []).reduce<NotificationSettings[]>((array, group) => {
    if (settings[group]) {
      const notificationTypes = userNotificationGroupTypes[group] || [];
      array.push(
        ...notificationTypes.map(notificationType => ({
          notificationType,
          notificationChannel,
          notificationFrequency: NotificationFrequency.Immediately,
        }))
      );
    }
    return array;
  }, []);
}
