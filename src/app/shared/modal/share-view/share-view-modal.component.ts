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
import {DialogType} from '../dialog-type';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {KeyCode} from '../../key-code';
import {User} from '../../../core/store/users/user';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {View} from '../../../core/store/views/view';
import {Permission} from '../../../core/store/permissions/permissions';
import {ViewsAction} from '../../../core/store/views/views.action';
import mixpanel from 'mixpanel-browser';
import {Angulartics2} from 'angulartics2';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../core/store/projects/projects.state';
import {selectAllUsers, selectCurrentUser} from '../../../core/store/users/users.state';
import {ShareViewDialogBodyComponent} from './body/share-view-dialog-body.component';
import {ConfigurationService} from '../../../configuration/configuration.service';
import {perspectiveIconsMap} from '../../../view/perspectives/perspective';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../core/store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {QueryItemsConverter} from '../../top-panel/search-box/query-item/query-items.converter';
import {queryItemsColor} from '../../../core/store/navigation/query/query.util';

@Component({
  templateUrl: './share-view-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewModalComponent implements OnInit {
  @Input()
  public view: View;

  @ViewChild(ShareViewDialogBodyComponent, {static: true})
  public shareViewDialogBody: ShareViewDialogBodyComponent;

  public currentUser$: Observable<User>;
  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public users$: Observable<User[]>;
  public viewColor$: Observable<string>;

  public readonly dialogType = DialogType;

  public icon: string;

  public formInvalid$ = new BehaviorSubject(true);
  public performingAction$ = new BehaviorSubject(false);

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService,
    private angulartics2: Angulartics2
  ) {}

  public ngOnInit() {
    this.icon = perspectiveIconsMap[this.view?.perspective] || '';

    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.users$ = this.store$.pipe(select(selectAllUsers));

    this.viewColor$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(
      map(([collections, linkTypes]) => ({collections, linkTypes})),
      map(queryData => new QueryItemsConverter(queryData).fromQuery(this.view.query)),
      map(queryItems => queryItemsColor(queryItems))
    );
  }

  public onSubmit() {
    this.shareViewDialogBody.onSubmit();
  }

  public onShare(data: {permissions: Permission[]; newUsers: User[]; newUsersRoles: Record<string, string[]>}) {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new ViewsAction.SetUserPermissions({
        viewId: this.view.id,
        ...data,
        onSuccess: () => this.hideDialog(),
        onInviteFailure: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );

    if (this.configurationService.getConfiguration().analytics) {
      this.angulartics2.eventTrack.next({
        action: 'View share',
        properties: {
          category: 'Collaboration',
          label: 'view',
          value: this.view.id,
        },
      });

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
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
