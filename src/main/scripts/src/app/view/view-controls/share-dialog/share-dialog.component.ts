/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NotificationsService} from 'angular2-notifications/dist';

import {UserService} from '../../../core/rest/user.service';
import {User} from '../../../core/dto/user';
import {KeyCode} from '../../../shared/key-code';

@Component({
  selector: 'share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss']
})
export class ShareDialogComponent implements OnInit {

  @Output()
  public closeDialog: EventEmitter<void> = new EventEmitter();

  public emails: string[] = [];
  public text = '';

  public users: User[] = [];
  public suggestions: string[];

  public constructor(private notificationService: NotificationsService,
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
      .map(user => user.username)
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
    this.close();
    this.notificationService.success('View shared', 'View has been shared with the selected users');
  }

  public close() {
    this.closeDialog.emit();
  }

  public get placeholder(): string {
    return this.emails.length === 0 ? 'Enter user emails...' : '';
  }

}
