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
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {UserDataValue} from '../../../core/model/data-value/user.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {User} from '../../../core/store/users/user';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {USER_AVATAR_SIZE} from '../../../core/constants';
import {uniqueValues} from '../../utils/array.utils';
import {isEmailValid} from '../../utils/email.utils';

@Component({
  selector: 'user-data-input',
  templateUrl: './user-data-input.component.html',
  styleUrls: ['./user-data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDataInputComponent implements OnChanges, AfterViewChecked {
  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public skipValidation: boolean;

  @Input()
  public value: UserDataValue;

  @Output()
  public valueChange = new EventEmitter<UserDataValue>();

  @Output()
  public save = new EventEmitter<UserDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('wrapperElement', {static: false})
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent, {static: false})
  public dropdown: OptionsDropdownComponent;

  public readonly avatarSize = USER_AVATAR_SIZE;

  public name: string = '';
  public users: User[];
  public selectedUsers: User[];
  public multi: boolean;

  private setFocus: boolean;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      this.users = this.bindUsers();
      this.selectedUsers = this.value.users;
      this.multi = this.value.config && this.value.config.multi;
      this.name = this.value.format();
    }
  }

  private bindUsers(): User[] {
    return (this.value && this.value.constraintData && this.value.constraintData.users) || [];
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        if (this.readonly) {
          return;
        }
        const selectedOption = this.dropdown.getActiveOption();

        event.preventDefault();

        if (this.multi && event.code !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
          this.dropdown.resetActiveOption();
        } else {
          this.preventSaveAndBlur();
          // needs to be executed after parent event handlers
          setTimeout(() => this.saveValue(selectedOption, event.code !== KeyCode.Tab));
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.name && this.multi && this.selectedUsers.length > 0) {
          this.selectedUsers = this.selectedUsers.slice(0, this.selectedUsers.length - 1);
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedUsers.some(o => o.email === option.value)) {
      this.selectedUsers = this.selectedUsers.filter(o => o.email !== option.value);
    } else {
      const selectUser = (this.users || []).find(o => o.email === option.value);
      if (selectUser) {
        this.selectedUsers = [...this.selectedUsers, selectUser];
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();
  }

  private saveValue(activeOption?: DropdownOption, enter?: boolean) {
    const inputIsEmail = isEmailValid(this.name.trim());
    if (this.multi) {
      const selectedUser = activeOption && this.users.find(option => option.email === activeOption.value);
      if (selectedUser || !this.value.config.externalUsers || !inputIsEmail) {
        const options = [...this.selectedUsers, selectedUser].filter(option => !!option);
        const emails = uniqueValues(options.map(option => option.email));
        const dataValue = this.value.copy(emails);
        this.save.emit(dataValue);
        return;
      }
    }

    if (activeOption || !this.name) {
      this.saveValueByOption(activeOption);
    } else if (
      this.name &&
      (this.skipValidation || (this.value.config && this.value.config.externalUsers)) &&
      inputIsEmail
    ) {
      if (this.multi) {
        const emails = uniqueValues([...this.selectedUsers.map(option => option.email), this.name.trim()]);
        this.save.emit(this.value.copy(emails));
      } else {
        this.save.emit(this.value.parseInput(this.name));
      }
    } else {
      if (enter) {
        this.enterInvalid.emit();
      } else {
        this.cancel.emit();
      }
    }
    this.resetSearchInput();
  }

  private saveValueByOption(option: DropdownOption) {
    const user = option && (this.users || []).find(u => (u.email || u.name) === option.value);
    const dataValue = this.value.copy(user ? user.email || user.name : '');
    this.save.emit(dataValue);
  }

  private resetSearchInput() {
    this.name = '';
  }

  public onInputChange() {
    const dataValue = this.value.parseInput(this.name);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const activeOption = this.multi ? null : this.dropdown && this.dropdown.getActiveOption();
      this.saveValue(activeOption);
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
  }

  private preventSaveAndBlur() {
    if (this.textInput) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
    }
  }

  public onSelectOption(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
    } else {
      this.preventSaveAndBlur();
      this.saveValue(option);
    }
  }

  private blurCleanup() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public onFocused() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (!this.readonly && this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  public trackByUser(index: number, user: User): string {
    return user.email || user.name;
  }
}
