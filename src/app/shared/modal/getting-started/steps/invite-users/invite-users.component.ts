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
import {ChangeDetectionStrategy, Component} from '@angular/core';

import {InvitationType} from '../../../../../core/model/invitation-type';
import {SelectItemModel} from '../../../../select/select-item/select-item.model';
import {GettingStartedService} from '../../getting-started.service';

@Component({
  selector: 'invite-users',
  templateUrl: './invite-users.component.html',
  styleUrls: ['./invite-users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block p-4'},
})
export class InviteUsersComponent {
  public items: SelectItemModel[] = [
    {
      id: InvitationType.JoinOnly,
      icons: ['fa fa-eye-slash'],
      value: $localize`:@@inviteUser.dialog.readOnlyNoAccess.title2:Just Join`,
      description: $localize`:@@inviteUser.dialog.readOnlyNoAccess.description1:New colleagues can join the project, they won't see existing tables and views.`,
    },
    {
      id: InvitationType.ReadOnly,
      icons: ['fa fa-eye'],
      value: $localize`:@@inviteUser.dialog.readOnly.title2:View`,
      description: $localize`:@@inviteUser.dialog.readOnly.description1:New colleagues will see everything in the project, they cannot change anything.`,
    },
    {
      id: InvitationType.ReadWrite,
      icons: ['fa fa-pencil'],
      value: $localize`:@@inviteUser.dialog.write.title2:Collaborate`,
      description: $localize`:@@inviteUser.dialog.write.description1:New colleagues will see everything in the project and they will be able to change and add data.`,
    },
    {
      id: InvitationType.Manage,
      icons: ['fa fa-cogs'],
      value: $localize`:@@inviteUser.dialog.manage.title2:Create`,
      description: $localize`:@@inviteUser.dialog.manage.description1:You give your newly invited colleagues full control over the project. They can read, write and manage everything.`,
    },
  ];

  constructor(public service: GettingStartedService) {}

  public onAddInvitation() {
    this.service.addInvitation();
  }

  public onEmailChanged(index: number, email: string) {
    this.service.setInvitationEmail(index, email);
  }

  public onTypeChanged(index: number, type: InvitationType) {
    this.service.setInvitationType(index, type);
  }

  public trackByIndex(index: number, item: any): string {
    return String(index);
  }
}
