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

import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';
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
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {selectCurrentUserForWorkspace, selectUsersForWorkspace} from '../../../../core/store/users/users.state';
import {ViewLinkTypePermissionsBodyComponent} from './body/view-link-type-permissions-body.component';
import {selectCurrentView} from '../../../../core/store/views/views.state';
import {Team} from '../../../../core/store/teams/team';
import {selectTeamsForWorkspace} from '../../../../core/store/teams/teams.state';
import {Permissions} from '../../../../core/store/permissions/permissions';
import {
  selectViewSettingsCollectionPermissions,
  selectViewSettingsId,
  selectViewSettingsLinkTypePermissions,
} from '../../../../core/store/view-settings/view-settings.state';
import {ViewSettingsAction} from '../../../../core/store/view-settings/view-settings.action';
import {take} from 'rxjs/operators';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {
  selectAllLinkTypes,
  selectLinkTypeByIdWithCollections,
} from '../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Collection} from '../../../../core/store/collections/collection';

@Component({
  templateUrl: './view-link-type-permissions-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewLinkTypePermissionsModalComponent implements OnInit {
  @Input()
  public otherCollectionId: string;

  @Input()
  public linkTypeId: string;

  @ViewChild(ViewLinkTypePermissionsBodyComponent)
  public bodyComponent: ViewLinkTypePermissionsBodyComponent;

  public currentUser$: Observable<User>;
  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public teams$: Observable<Team[]>;
  public users$: Observable<User[]>;
  public view$: Observable<View>;
  public collectionPermissions$: Observable<Permissions>;
  public linkTypePermissions$: Observable<Permissions>;
  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public linkTypes$: Observable<LinkType[]>;

  public readonly dialogType = DialogType;

  public performingAction$ = new BehaviorSubject(false);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
    this.users$ = this.store$.pipe(select(selectUsersForWorkspace));
    this.view$ = this.store$.pipe(select(selectCurrentView));
    this.teams$ = this.store$.pipe(select(selectTeamsForWorkspace));
    this.linkTypes$ = this.store$.pipe(select(selectAllLinkTypes));
    this.collectionPermissions$ = this.store$.pipe(
      select(selectViewSettingsCollectionPermissions(this.otherCollectionId))
    );
    this.collection$ = this.store$.pipe(select(selectCollectionById(this.otherCollectionId)));
    this.linkTypePermissions$ = this.store$.pipe(select(selectViewSettingsLinkTypePermissions(this.linkTypeId)));
    this.linkType$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.linkTypeId)));
  }

  public onSubmit() {
    this.bodyComponent?.onSubmit();
  }

  public onSubmitPermissions(data: {linkTypePermissions: Permissions; collectionPermissions: Permissions}) {
    this.store$.pipe(select(selectViewSettingsId), take(1)).subscribe(settingsId => {
      this.store$.dispatch(
        new ViewSettingsAction.SetCollectionPermissions({
          settingsId,
          collectionId: this.otherCollectionId,
          permissions: data.collectionPermissions,
        })
      );
      this.store$.dispatch(
        new ViewSettingsAction.SetLinkTypePermissions({
          settingsId,
          linkTypeId: this.linkTypeId,
          permissions: data.linkTypePermissions,
        })
      );
    });

    this.hideDialog();
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
