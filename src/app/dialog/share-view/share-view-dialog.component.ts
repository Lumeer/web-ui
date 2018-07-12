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
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {filter, map, mergeMap} from 'rxjs/operators';
import {Subscription, combineLatest as observableCombineLatest} from 'rxjs';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {UserModel} from '../../core/store/users/user.model';
import {UsersAction} from '../../core/store/users/users.action';
import {selectAllUsers, selectCurrentUser} from '../../core/store/users/users.state';
import {KeyCode} from '../../shared/key-code';
import {HtmlModifier} from '../../shared/utils/html-modifier';
import {ActivatedRoute} from '@angular/router';
import {selectViewByCode} from '../../core/store/views/views.state';
import {ViewModel} from '../../core/store/views/view.model';
import {ViewsAction} from '../../core/store/views/views.action';
import {PermissionType} from '../../core/store/permissions/permissions.model';

@Component({
  selector: 'share-view-dialog',
  templateUrl: './share-view-dialog.component.html',
  styleUrls: ['./share-view-dialog.component.scss']
})
export class ShareViewDialogComponent implements OnInit, OnDestroy {

  public selectedUsers: UserModel[] = [];
  public userRoles: { [id: string]: string[] };
  public initialUserRoles: { [id: string]: string[] };
  public text = '';
  public selectedIndex: number;
  public users: UserModel[] = [];
  public suggestions: string[];
  public view: ViewModel;
  public currentUser: UserModel;

  private organization: OrganizationModel;
  private subscriptions = new Subscription();

  public constructor(private i18n: I18n,
                     private route: ActivatedRoute,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToView();
    this.subscribeData();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
        this.addItemOrShare();
        return;
      case KeyCode.UpArrow:
      case KeyCode.DownArrow:
        this.onUpAndDownArrowKeysDown(event);
        return;
    }
  }

  public deleteUser(user: UserModel) {
    delete this.userRoles[user.id];
    this.userRoles = {...this.userRoles};
    this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
  }

  public onNewRoles(user: UserModel, roles: string[]) {
    this.userRoles = {...this.userRoles, [user.id]: roles};
  }

  public getUserRoles(user: UserModel): string[] {
    return this.userRoles[user.id] || [];
  }

  private onUpAndDownArrowKeysDown(event: KeyboardEvent) {
    if (this.suggestions.length === 0) {
      return;
    }

    event.preventDefault();
    const direction = event.keyCode === KeyCode.UpArrow ? -1 : 1;

    const newIndex = isNullOrUndefined(this.selectedIndex) ? 0 : this.selectedIndex + direction;
    if (newIndex >= 0 && newIndex < this.suggestions.length) {
      this.selectedIndex = newIndex;
    }
  }

  private addItemOrShare() {
    if (this.text.trim() === '') {
      if (this.selectedUsers.length > 0) {
        this.share();
      }
    } else {
      this.addItem(this.text);
    }
  }

  private addItem(text: string) {
    if (!isNullOrUndefined(this.selectedIndex) && this.selectedIndex < this.suggestions.length) {
      this.addUserWithEmail(this.suggestions[this.selectedIndex]);
    } else {
      const userChosen = this.selectedUsers.find(u => u.email.toLowerCase() === text.toLowerCase());
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

  private addUser(user: UserModel) {
    this.userRoles = {...this.userRoles, [user.id]: []};
    this.selectedUsers = [...this.selectedUsers, user];
    this.text = '';
  }

  public suggest() {
    this.suggestions = this.users
      .map(user => user.email)
      .filter(email => email.toLowerCase().includes(this.text.toLowerCase()))
      .filter(email => !this.selectedUsers.find(user => user.email === email));

    this.recomputeSelectedIndex();
  }

  private recomputeSelectedIndex() {
    if (this.suggestions.length === 0 || !this.text) {
      this.selectedIndex = null;
    } else if (!isNullOrUndefined(this.selectedIndex)) {
      this.selectedIndex = Math.min(this.selectedIndex, this.suggestions.length - 1);
    }
  }

  public onSuggestionClick(text: string) {
    this.addItem(text);
  }

  public share() {
    const permissions = Object.keys(this.userRoles).map(id => ({id, roles: this.userRoles[id]}));
    this.store.dispatch(new ViewsAction.SetPermissions({viewCode: this.view.code, type: PermissionType.Users, permissions}));
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  private subscribeToView() {
    const subscription = this.route.paramMap.pipe(
      map(params => params.get('viewCode')),
      filter(viewCode => !!viewCode),
      mergeMap(viewCode => observableCombineLatest(this.store.select(selectViewByCode(viewCode)),
        this.store.select(selectAllUsers)))
    ).subscribe(([view, users]) => {
      this.view = view;
      this.users = users;
      this.selectedUsers = this.view.permissions.users.reduce((acc, userPerm) => {
        const user = users.find(u => u.id === userPerm.id);
        if (user) {
          acc.push(user);
        }
        return acc;
      }, []);
      this.userRoles = this.view.permissions.users.reduce((acc, userPerm) => {
        acc[userPerm.id] = userPerm.roles;
        return acc;
      }, {});
      this.initialUserRoles = {...this.userRoles};
    });
  }

  private subscribeData() {
    const organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => {
        if (isNullOrUndefined(this.organization) || this.organization.id !== organization.id) {
          this.store.dispatch(new UsersAction.Get({organizationId: organization.id}));
        }
        this.organization = organization;
      });
    this.subscriptions.add(organizationSubscription);

    const currentUserSubscription = this.store.select(selectCurrentUser)
      .subscribe(user => this.currentUser = user);
  }

  public trackByUser(index: number, user: UserModel): string {
    return user.id;
  }

}
