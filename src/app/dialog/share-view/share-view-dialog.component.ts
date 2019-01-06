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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest as observableCombineLatest, Subscription} from 'rxjs';
import {filter, map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Organization} from '../../core/store/organizations/organization';
import {Permission, PermissionType} from '../../core/store/permissions/permissions';
import {User} from '../../core/store/users/user';
import {selectAllUsers, selectCurrentUser} from '../../core/store/users/users.state';
import {View} from '../../core/store/views/view';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectViewByCode} from '../../core/store/views/views.state';
import {KeyCode} from '../../shared/key-code';
import {ClipboardService} from '../../core/service/clipboard.service';
import {isNullOrUndefined} from '../../shared/utils/common.utils';
import {Project} from '../../core/store/projects/project';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';
import {ResourceType} from '../../core/model/resource-type';
import {userIsManagerInWorkspace} from '../../shared/utils/resource.utils';
import {UserRolesInResourcePipe} from '../../shared/pipes/user-roles-in-resource.pipe';

@Component({
  selector: 'share-view-dialog',
  templateUrl: './share-view-dialog.component.html',
  styleUrls: ['./share-view-dialog.component.scss'],
})
export class ShareViewDialogComponent implements OnInit, OnDestroy {
  public staticUsers: User[] = [];
  public changeableUsers: User[] = [];
  public userRoles: {[id: string]: string[]} = {};
  public initialUserRoles: {[id: string]: string[]} = {};
  public currentUser: User;
  public organization: Organization;
  public project: Project;

  public text$ = new BehaviorSubject<string>('');
  public suggestions$ = new BehaviorSubject<string[]>([]);
  public selectedIndex$ = new BehaviorSubject<number>(null);
  public viewShareUrl$ = new BehaviorSubject<string>('');

  public viewResourceType = ResourceType.View;

  private view: View;
  private users: User[] = [];
  private subscriptions = new Subscription();

  public constructor(
    private i18n: I18n,
    private clipboardService: ClipboardService,
    private userRolesInResourcePipe: UserRolesInResourcePipe,
    private route: ActivatedRoute,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.subscribeToView();
    this.parseViewShareUrl();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public copyToClipboard() {
    this.clipboardService.copy(this.viewShareUrl$.getValue());
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
        this.addItem(this.text$.getValue().trim());
        return;
      case KeyCode.ArrowUp:
      case KeyCode.ArrowDown:
        this.onUpAndDownArrowKeysDown(event);
        return;
    }
  }

  private addItem(text: string) {
    const selectedIndex = this.selectedIndex$.getValue();
    const suggestions = this.suggestions$.getValue();

    if (!isNullOrUndefined(selectedIndex) && selectedIndex < suggestions.length) {
      this.addUserWithEmail(suggestions[selectedIndex]);
    } else {
      const userChosen = this.changeableUsers.find(u => u.email.toLowerCase() === text.toLowerCase());
      const user = this.users.find(u => u.email.toLowerCase() === text.toLowerCase());
      if (!userChosen && user) {
        this.addUser(user);
      }
    }
  }

  private addUserWithEmail(email: string) {
    const user = this.users.find(u => u.email === email);
    if (user) {
      this.addUser(user);
    }
  }

  private addUser(user: User) {
    this.userRoles = {...this.userRoles, [user.id]: []};
    this.changeableUsers = [...this.changeableUsers, user];
    this.text$.next('');
  }

  private onUpAndDownArrowKeysDown(event: KeyboardEvent) {
    const suggestions = this.suggestions$.getValue();
    if (suggestions.length === 0) {
      return;
    }

    event.preventDefault();
    const direction = event.code === KeyCode.ArrowUp ? -1 : 1;

    const selectedIndex = this.selectedIndex$.getValue();
    const newIndex = isNullOrUndefined(selectedIndex) ? 0 : selectedIndex + direction;
    if (newIndex >= 0 && newIndex < suggestions.length) {
      this.selectedIndex$.next(newIndex);
    }
  }

  public deleteUser(user: User) {
    delete this.userRoles[user.id];
    this.userRoles = {...this.userRoles};
    this.changeableUsers = this.changeableUsers.filter(u => u.id !== user.id);
  }

  public onNewRoles(user: User, roles: string[]) {
    this.userRoles = {...this.userRoles, [user.id]: roles};
  }

  public suggest() {
    const textLowerCase = this.text$.getValue().toLowerCase();
    const newSuggestions = this.users
      .filter(user => !this.isUserPresented(user))
      .map(user => user.email)
      .filter(email => email.toLowerCase().includes(textLowerCase));

    this.suggestions$.next(newSuggestions);
    this.recomputeSelectedIndex();
  }

  private isUserPresented(user: User): boolean {
    return !!this.changeableUsers.find(u => u.id === user.id) || !!this.staticUsers.find(u => u.id === user.id);
  }

  private recomputeSelectedIndex() {
    const text = this.text$.getValue();
    const selectedIndex = this.selectedIndex$.getValue();
    const suggestions = this.suggestions$.getValue();

    if (suggestions.length === 0 || !text) {
      this.selectedIndex$.next(null);
    } else if (!isNullOrUndefined(selectedIndex)) {
      this.selectedIndex$.next(Math.min(selectedIndex, suggestions.length - 1));
    }
  }

  public onInputChanged(value: string) {
    this.text$.next(value);
  }

  public onSuggestionClick(text: string) {
    this.addItem(text);
  }

  public share() {
    const changeablePermissions: Permission[] = Object.keys(this.userRoles)
      .filter(id => this.changeableUsers.find(user => user.id === id))
      .map(id => ({id, roles: this.userRoles[id]}));

    const staticPermissions = this.staticUsers
      .map(user => this.getUserPermissionsInView(user))
      .filter(permission => permission && permission.roles && permission.roles.length > 0);

    const permissions = [...changeablePermissions, ...staticPermissions];

    this.store$.dispatch(
      new ViewsAction.SetPermissions({viewCode: this.view.code, type: PermissionType.Users, permissions})
    );
  }

  private getUserPermissionsInView(user: User): Permission {
    return this.view.permissions.users.find(permission => permission.id === user.id);
  }

  private subscribeToView() {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          map(params => params.get('viewCode')),
          filter(viewCode => !!viewCode),
          mergeMap(viewCode =>
            observableCombineLatest(
              this.store$.pipe(select(selectViewByCode(viewCode))),
              this.store$.pipe(select(selectWorkspaceModels)),
              this.store$.pipe(select(selectAllUsers)),
              this.store$.pipe(select(selectCurrentUser))
            )
          ),
          filter(
            ([view, models, users, currentUser]) =>
              view && models.organization && models.project && !!users && !!currentUser
          )
        )
        .subscribe(([view, models, users, currentUser]) => {
          this.view = view;
          this.users = users;
          this.organization = models.organization;
          this.project = models.project;
          this.currentUser = currentUser;
          this.initUsers();
        })
    );
  }

  private initUsers() {
    for (const user of this.users) {
      if (userIsManagerInWorkspace(user, this.organization, this.project) || user.id === this.currentUser.id) {
        this.addUserToStaticIfNotPresented(user);
      } else if (this.view.permissions.users.find(u => u.id === user.id)) {
        this.addUserToChangeableIfNotPresented(user);
      }
    }
    this.checkRemovedUsers();
  }

  private addUserToStaticIfNotPresented(user: User) {
    if (!this.isUserPresented(user)) {
      this.staticUsers.push(user);
      this.initRolesForUser(user);
    }
  }

  private initRolesForUser(user: User) {
    const roles = this.userRolesInResourcePipe.transform(
      user,
      this.view,
      this.viewResourceType,
      this.organization,
      this.project
    );
    this.userRoles[user.id] = roles;
    this.initialUserRoles[user.id] = roles;
  }

  private addUserToChangeableIfNotPresented(user: User) {
    if (!this.isUserPresented(user)) {
      this.changeableUsers.push(user);
      this.initRolesForUser(user);
    }
  }

  private checkRemovedUsers() {
    const userIds = this.users.map(user => user.id);
    this.staticUsers = this.staticUsers.filter(user => userIds.includes(user.id));
    this.changeableUsers = this.changeableUsers.filter(user => userIds.includes(user.id));
  }

  private parseViewShareUrl() {
    const currentUrl = window.location.href;
    const match = currentUrl.match('.+/w/.+/.+/view;vc=[^/]+');
    if (match && match[0]) {
      this.viewShareUrl$.next(match[0]);
    }
  }

  public trackByUser(index: number, user: User): string {
    return user.id;
  }
}
