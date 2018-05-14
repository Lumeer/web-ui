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
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {UserModel} from '../../core/store/users/user.model';
import {UsersAction} from '../../core/store/users/users.action';
import {selectAllUsers} from '../../core/store/users/users.state';
import {KeyCode} from '../../shared/key-code';
import {HtmlModifier} from '../../shared/utils/html-modifier';

@Component({
  selector: 'share-view-dialog',
  templateUrl: './share-view-dialog.component.html',
  styleUrls: ['./share-view-dialog.component.scss']
})
export class ShareViewDialogComponent implements OnInit, OnDestroy {

  public emails: string[] = [];
  public text = '';

  public users: UserModel[] = [];
  public suggestions: string[];

  private organization: OrganizationModel;
  private organizationSubscription: Subscription;
  private usersSubscription: Subscription;

  public constructor(private i18n: I18n,
                     private notificationService: NotificationService,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeData();
  }

  public ngOnDestroy() {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }

  public onKeyUp(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Enter:
        return;
      case KeyCode.Backspace:
      default:
        this.suggest();
    }
  }

  public onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case KeyCode.Backspace:
        this.removeItem();
        return;
      case KeyCode.Enter:
        this.addItemOrShare();
        return;
    }
  }

  private removeItem() {
    if (this.text === '') {
      event.preventDefault();
      this.emails.pop();
    }
  }

  private addItemOrShare() {
    if (this.text.trim() === '') {
      if (this.emails.length > 0) {
        this.share();
      }
    } else {
      this.addItem(this.text);
    }
  }

  private addItem(text: string) {
    this.emails.push(text);
    this.text = '';
  }

  public suggest() {
    this.suggestions = this.users
      .map(user => user.email)
      .filter(username => username.includes(this.text))
      .filter(username => !this.emails.includes(username));
  }

  public onSuggestionClick(text: string) {
    this.addItem(text);
  }

  public hideSuggestions() {
    this.suggestions = [];
  }

  public share() {
    const message = this.i18n({id: 'view.shared.success', value: 'View has been shared with the selected users'});
    this.notificationService.success(message);
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

  private subscribeData() {
    this.organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => {
        if (isNullOrUndefined(this.organization) || this.organization.id != organization.id) {
          this.store.dispatch(new UsersAction.Get({organizationId: organization.id}));
        }
        this.organization = organization;
      });
    this.usersSubscription = this.store.select(selectAllUsers)
      .subscribe(users => this.users = users);
  }

}
