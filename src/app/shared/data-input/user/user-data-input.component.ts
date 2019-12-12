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
import {TypeaheadMatch} from 'ngx-bootstrap/typeahead';
import {UserDataValue} from '../../../core/model/data-value/user.data-value';
import {KeyCode} from '../../key-code';
import {HtmlModifier} from '../../utils/html-modifier';
import {User} from '../../../core/store/users/user';
import {DataValueInputType} from '../../../core/model/data-value';

export const USER_AVATAR_SIZE = 22;

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
  public dataBlur = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<any>();

  @ViewChild('textInput', {static: false})
  public textInput: ElementRef<HTMLInputElement>;

  public readonly avatarSize = USER_AVATAR_SIZE;

  public name: string = '';
  public users: User[];

  private setFocus: boolean;
  private triggerInput: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      if (this.value.inputType === DataValueInputType.Typed) {
        this.name = this.value.format();
        this.triggerInput = true;
      }
    }
    if (changes.value) {
      this.users = this.bindUsers();
    }
  }

  private bindUsers(): User[] {
    return ((this.value && this.value.constraintData && this.value.constraintData.users) || []).map(user => ({
      ...user,
      name: user.name || user.email,
    }));
  }

  public ngAfterViewChecked() {
    if (this.setFocus) {
      this.setFocusToInput();
      this.setFocus = false;
    }
    if (this.triggerInput) {
      this.dispatchInputEvent();
      this.triggerInput = false;
    }
  }

  private setFocusToInput() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      HtmlModifier.setCursorAtTextContentEnd(element);
      element.focus();
    }
  }

  private dispatchInputEvent() {
    if (this.textInput) {
      const element = this.textInput.nativeElement;
      const event = new Event('input', {
        bubbles: true,
        cancelable: true,
      });
      setTimeout(() => element.dispatchEvent(event));
    }
  }

  @HostListener('keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        // needs to be executed after parent event handlers
        setTimeout(() => this.saveValue());
        return;
      case KeyCode.Escape:
        this.resetSearchInput();
        this.cancel.emit();
        return;
    }
  }

  private saveValue() {
    const {users} = this.value.constraintData;
    const user = users.find(u => u.name === this.name);
    if (user || !this.name) {
      const dataValue = this.value.copy(user ? user.email : '');
      this.save.emit(dataValue);
    } else if (this.name && (this.skipValidation || (this.value.config && this.value.config.externalUsers))) {
      const dataValue = this.value.parseInput(this.name);
      this.save.emit(dataValue);
    } else {
      this.cancel.emit();
    }
    this.resetSearchInput();
  }

  private resetSearchInput() {
    this.name = '';
  }

  public onSelect(event: TypeaheadMatch) {
    const dataValue = this.value.copy(event.item.email);
    this.save.emit(dataValue);
  }

  public onInputChange() {
    const dataValue = this.value.parseInput(this.name);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.cancel.emit();
    this.dataBlur.emit();
  }
}
