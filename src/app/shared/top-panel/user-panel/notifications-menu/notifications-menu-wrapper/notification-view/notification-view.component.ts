/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {ViewSharedUserNotification} from '../../../../../../core/model/user-notification';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {Workspace} from '../../../../../../core/store/navigation/workspace';
import {Project} from '../../../../../../core/store/projects/project';
import {perspectiveIconsMap} from '../../../../../../view/perspectives/perspective';

@Component({
  selector: 'notification-view',
  templateUrl: './notification-view.component.html',
  styleUrls: ['../notification-resource.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationViewComponent {
  @Input()
  public notification: ViewSharedUserNotification;

  @Input()
  public organizations: Organization;

  @Input()
  public workspace: Workspace;

  @Input()
  public currentProject: Project;

  public readonly perspectiveIcons = perspectiveIconsMap;
}
