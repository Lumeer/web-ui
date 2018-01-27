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

import {Component, OnInit} from '@angular/core';

import {UserService} from '../../../core/rest/user.service';
import {User} from '../../../core/dto/user';
import {KeyCode} from '../../../shared/key-code';
import {HtmlModifier} from '../../../shared/utils/html-modifier';
import {NotificationService} from '../../../core/notifications/notification.service';

@Component({
  selector: 'share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss']
})
export class ShareDialogComponent implements OnInit {

  public emails: string[] = [];
  public text = '';

  public users: User[] = [];
  public suggestions: string[];

  public constructor(private notificationService: NotificationService,
                     private userService: UserService) {
  }

  public ngOnInit() {
    this.userService.getUsers().subscribe((users: User[]) => {
      this.users = users;
    });
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
    this.notificationService.success('View has been shared with the selected users');
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

}
