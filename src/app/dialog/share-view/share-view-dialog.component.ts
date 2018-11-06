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
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest as observableCombineLatest, Subscription} from 'rxjs';
import {filter, map, mergeMap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {PermissionType} from '../../core/store/permissions/permissions.model';
import {UserModel} from '../../core/store/users/user.model';
import {UsersAction} from '../../core/store/users/users.action';
import {selectAllUsers, selectCurrentUser} from '../../core/store/users/users.state';
import {ViewModel} from '../../core/store/views/view.model';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectViewByCode} from '../../core/store/views/views.state';
import {KeyCode} from '../../shared/key-code';
import {ClipboardService} from '../../core/service/clipboard.service';

@Component({
  selector: 'share-view-dialog',
  templateUrl: './share-view-dialog.component.html',
  styleUrls: ['./share-view-dialog.component.scss']
})
export class ShareViewDialogComponent implements OnInit, OnDestroy {

  public selectedUsers: UserModel[] = [];
  public userRoles: { [id: string]: string[] };
  public initialUserRoles: { [id: string]: string[] };
  public users: UserModel[] = [];
  public view: ViewModel;
  public currentUser: UserModel;

  public text$ = new BehaviorSubject<string>('');
  public suggestions$ = new BehaviorSubject<string[]>([]);
  public selectedIndex$ = new BehaviorSubject<number>(null);
  public viewShareUrl$ = new BehaviorSubject<string>('');

  private organization: OrganizationModel;
  private subscriptions = new Subscription();

  public constructor(private i18n: I18n,
                     private clipboardService: ClipboardService,
                     private route: ActivatedRoute,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToView();
    this.subscribeData();
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
        this.addItemOrShare();
        return;
      case KeyCode.ArrowUp:
      case KeyCode.ArrowDown:
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

  private addItemOrShare() {
    const text = this.text$.getValue();
    if (text.trim() === '') {
      if (this.selectedUsers.length > 0) {
        this.share();
      }
    } else {
      this.addItem(text);
    }
  }

  private addItem(text: string) {
    const selectedIndex = this.selectedIndex$.getValue();
    const suggestions = this.suggestions$.getValue();

    if (!isNullOrUndefined(selectedIndex) && selectedIndex < suggestions.length) {
      this.addUserWithEmail(suggestions[selectedIndex]);
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
    this.text$.next('');
  }

  public suggest() {
    const textLowerCase = this.text$.getValue().toLowerCase();
    const newSuggestions = this.users
      .map(user => user.email)
      .filter(email => email.toLowerCase().includes(textLowerCase))
      .filter(email => !this.selectedUsers.find(user => user.email === email));

    this.suggestions$.next(newSuggestions);
    this.recomputeSelectedIndex();
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
    const permissions = Object.keys(this.userRoles).map(id => ({id, roles: this.userRoles[id]}));
    this.store.dispatch(new ViewsAction.SetPermissions({viewCode: this.view.code, type: PermissionType.Users, permissions}));
  }

  private subscribeToView() {
    this.subscriptions.add(this.route.paramMap.pipe(
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
    }));
  }

  private parseViewShareUrl() {
    const currentUrl = window.location.href;
    const match = currentUrl.match('.+\/w\/.+\/.+\/view;vc=[^/]+');
    if (match && match[0]) {
      this.viewShareUrl$.next(match[0]);
    }
  }

  private subscribeData() {
    this.subscriptions.add(this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => {
        if (isNullOrUndefined(this.organization) || this.organization.id !== organization.id) {
          this.store.dispatch(new UsersAction.Get({organizationId: organization.id}));
        }
        this.organization = organization;
      }));

    this.subscriptions.add(this.store.select(selectCurrentUser)
      .subscribe(user => this.currentUser = user));
  }

  public trackByUser(index: number, user: UserModel): string {
    return user.id;
  }

}
