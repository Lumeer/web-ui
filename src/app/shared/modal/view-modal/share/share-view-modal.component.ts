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

import {Component, OnInit, ChangeDetectionStrategy, HostListener, ViewChild, Input} from '@angular/core';
import {DialogType} from '../../dialog-type';
import {BehaviorSubject, Observable} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {keyboardEventCode, KeyCode} from '../../../key-code';
import {User} from '../../../../core/store/users/user';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {View} from '../../../../core/store/views/view';
import {Permissions, Role} from '../../../../core/store/permissions/permissions';
import {ViewsAction} from '../../../../core/store/views/views.action';
import mixpanel from 'mixpanel-browser';
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {selectCurrentUserForWorkspace, selectUsersForWorkspace} from '../../../../core/store/users/users.state';
import {ShareViewDialogBodyComponent} from './body/share-view-dialog-body.component';
import {ConfigurationService} from '../../../../configuration/configuration.service';
import {selectViewById} from '../../../../core/store/views/views.state';
import {Team} from '../../../../core/store/teams/team';
import {selectTeamsForWorkspace} from '../../../../core/store/teams/teams.state';
import {Ga4Service} from '../../../../core/service/ga4.service';

@Component({
  selector: 'share-view-modal',
  templateUrl: './share-view-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewModalComponent implements OnInit {
  @Input()
  public view: View;

  @ViewChild(ShareViewDialogBodyComponent)
  public shareViewDialogBody: ShareViewDialogBodyComponent;

  public currentUser$: Observable<User>;
  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public teams$: Observable<Team[]>;
  public users$: Observable<User[]>;
  public view$: Observable<View>;

  public readonly dialogType = DialogType;

  public formInvalid$ = new BehaviorSubject(true);
  public performingAction$ = new BehaviorSubject(false);

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService,
    private ga4: Ga4Service
  ) {}

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
    this.users$ = this.store$.pipe(select(selectUsersForWorkspace));
    this.view$ = this.store$.pipe(select(selectViewById(this.view.id)));
    this.teams$ = this.store$.pipe(select(selectTeamsForWorkspace));

    this.store$.dispatch(new ViewsAction.GetOne({viewId: this.view.id}));
  }

  public onSubmit() {
    this.shareViewDialogBody.onSubmit();
  }

  public onShare(data: {
    permissions: Permissions;
    newUsers: User[];
    newUsersRoles: Record<string, Role[]>;
    newTeams: Team[];
  }) {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new ViewsAction.SetPermissions({
        viewId: this.view.id,
        ...data,
        onSuccess: () => this.hideDialog(),
        onInviteFailure: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );

    if (this.configurationService.getConfiguration().analytics) {
      this.ga4.event('view_share', {view: this.view.id});

      if (this.configurationService.getConfiguration().mixpanelKey) {
        mixpanel.track('View Shared', {view: this.view.id});
      }
    }
  }

  public onRolesChanged(changed: boolean) {
    this.formInvalid$.next(!changed);
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
