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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {User} from '../../../core/store/users/user';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {USER_AVATAR_SIZE} from '../../../core/constants';
import {ServiceLimits} from '../../../core/store/organizations/service-limits/service.limits';
import {Team} from '../../../core/store/teams/team';

@Component({
  selector: 'user-settings-header',
  templateUrl: './user-settings-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSettingsHeaderComponent {
  @Input()
  public isCurrent: boolean;

  @Input()
  public user: User;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public serviceLimits: ServiceLimits;

  @Input()
  public teams: Team[];

  @Output()
  public delete = new EventEmitter();

  @Output()
  public back = new EventEmitter();

  public readonly avatarSize = USER_AVATAR_SIZE;

  public onBack() {
    this.back.emit();
  }

  public onDelete() {
    this.delete.emit();
  }
}
