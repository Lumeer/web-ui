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
  public selectedUses: User[];
  public multi: boolean;

  private setFocus: boolean;
  private triggerInput: boolean;
  private preventSave: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.resetSearchInput();
      this.setFocus = true;
      this.triggerInput = true;
    }
    if (changes.value && this.value) {
      this.users = this.bindUsers();
      this.selectedUses = this.value.users;
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
        if (this.readonly) {
          return;
        }
        const selectedOption = this.dropdown.getActiveOption();

        if (this.multi && event.code !== KeyCode.Tab && selectedOption) {
          event.preventDefault();
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
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.name && this.multi && this.users.length > 0) {
          this.users = this.users.slice(0, this.users.length - 1);
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.users.some(o => o.email === option.value)) {
      this.selectedUses = this.selectedUses.filter(o => o.email !== option.value);
    } else {
      const selectUser = (this.users || []).find(o => o.email === option.value);
      if (selectUser) {
        this.selectedUses = [...this.selectedUses, selectUser];
        setTimeout(() => this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER);
      }
    }
  }

  private saveValue(activeOption?: DropdownOption, enter?: boolean) {
    if (this.multi) {
      const selectedUser = activeOption && this.users.find(option => option.email === activeOption.value);
      const options = [...this.selectedUses, selectedUser].filter(option => !!option);
      const emails = uniqueValues(options.map(option => option.email));
      const dataValue = this.value.copy(emails);
      this.save.emit(dataValue);
      return;
    }

    if (activeOption) {
      this.saveValueByOption(activeOption);
    } else if (this.name && (this.skipValidation || (this.value.config && this.value.config.externalUsers))) {
      const dataValue = this.value.parseInput(this.name);
      this.save.emit(dataValue);
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
    const user = (this.users || []).find(u => (u.email || u.name) === option.value);
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
    this.wrapperElement.nativeElement.scrollLeft = 0;
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else {
      const activeOption = this.multi ? null : this.dropdown && this.dropdown.getActiveOption();
      this.saveValue(activeOption);
    }
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

}
