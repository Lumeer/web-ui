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
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {User} from '../../../../core/store/users/user';
import {DropdownOption} from '../../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../../dropdown/options/options-dropdown.component';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {isEmailValid} from '../../../utils/email.utils';

@Component({
  selector: 'view-users-input',
  templateUrl: './view-users-input.component.html',
  styleUrls: ['./view-users-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUsersInputComponent implements OnChanges {
  @Input()
  public readableUsers: User[];

  @Input()
  public currentUsers: User[];

  @Input()
  public addNewUsers: boolean;

  @Output()
  public selectUser = new EventEmitter<User>();

  @Output()
  public addUser = new EventEmitter<string>();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public text = '';

  public availableUsers: User[];

  constructor(public element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readableUsers || changes.currentUsers) {
      this.filterAvailableUsers();
    }
  }

  private filterAvailableUsers() {
    const currentUsersByEmail = (this.currentUsers || []).reduce((map, user) => ({...map, [user.email]: user}), {});
    this.availableUsers = (this.readableUsers || []).filter(user => !currentUsersByEmail[user.email]);
  }

  public onSelectOption(option: DropdownOption) {
    const selectedUser = this.readableUsers.find(user => user.email === option.value);
    if (selectedUser) {
      this.selectUser.emit(selectedUser);
    }
    this.text = '';
  }

  public onEnter() {
    const trimmed = this.text.trim();
    const selectedUser = this.readableUsers.find(user => user.email === trimmed);
    if (selectedUser) {
      this.selectUser.emit(selectedUser);
      this.text = '';
    } else if (this.addNewUsers && isEmailValid(trimmed)) {
      this.addUser.emit(trimmed);
      this.text = '';
    }
  }

  public onFocus() {
    this.dropdown?.open();
  }

  public onInput() {
    if (!this.dropdown?.isOpen()) {
      this.openAfterTimeout();
    }
  }

  private openAfterTimeout() {
    setTimeout(() => this.dropdown?.open());
  }

  public onBlur() {
    this.dropdown?.close();
  }

  public onKeyDown(event: KeyboardEvent, canAddUser: boolean) {
    if (keyboardEventCode(event) === KeyCode.Enter) {
      const activeOption = this.dropdown?.getActiveOption();
      if (activeOption) {
        this.onSelectOption(activeOption);
      } else if (this.addNewUsers && canAddUser) {
        this.onEnter();
      }
      return;
    }
    this.dropdown?.onKeyDown(event);
  }
}
