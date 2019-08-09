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

import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap';
import {InviteUserDialogComponent} from './invite-user-dialog/invite-user-dialog.component';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {Observable} from 'rxjs';
import {Project} from '../../../../core/store/projects/project';
import {ResourceType} from '../../../../core/model/resource-type';

@Component({
  selector: 'invite-user',
  templateUrl: './invite-user.component.html',
  styleUrls: ['./invite-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteUserComponent {
  @Input()
  public mobile: boolean;

  public project$: Observable<Project>;

  public readonly projectType = ResourceType.Project;

  constructor(private modalService: BsModalService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
  }

  public onInviteUser() {
    this.modalService.show(InviteUserDialogComponent, {keyboard: true});
  }
}
