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
import {ConstraintType} from '../../../core/model/data/constraint';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration, UserDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {BehaviorSubject} from 'rxjs';

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
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: UserDataValue;

  @Input()
  public configuration: UserDataInputConfiguration;

  @Output()
  public valueChange = new EventEmitter<UserDataValue>();

  @Output()
  public save = new EventEmitter<{action: DataInputSaveAction; dataValue: UserDataValue}>();

  @Output()
  public cancel = new EventEmitter();

  @Output()
  public enterInvalid = new EventEmitter();

  @ViewChild('wrapperElement')
  public wrapperElement: ElementRef<HTMLElement>;

  @ViewChild('textInput')
  public textInput: ElementRef<HTMLInputElement>;

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly avatarSize = USER_AVATAR_SIZE;
  public readonly inputClass = constraintTypeClass(ConstraintType.User);

  public name: string = '';
  public users: User[];
  public selectedUsers$ = new BehaviorSubject<User[]>([]);
  public multi: boolean;

  private setFocus: boolean;
  private preventSave: boolean;
  private keyDownListener: (event: KeyboardEvent) => void;
  private mouseDownListener: (event: MouseEvent) => void;

  constructor(private element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly && this.focus) {
      this.addListeners();
      this.resetSearchInput();
      this.setFocus = true;
    }
    if (changes.value && this.value) {
      this.selectedUsers$.next(this.value.users || []);
      this.users = this.bindUsers();
      this.multi = this.value.config?.multi;
      this.name = this.value.inputValue || '';
    }
  }

  private addListeners() {
    this.removeListeners();

    this.keyDownListener = event => this.onKeyDown(event);
    this.element.nativeElement.addEventListener('keydown', this.keyDownListener);

    this.mouseDownListener = event => this.onMouseDown(event);
    this.element.nativeElement.addEventListener('mousedown', this.mouseDownListener);
  }

  private removeListeners() {
    if (this.keyDownListener) {
      this.element.nativeElement.removeEventListener('keydown', this.keyDownListener);
    }
    this.keyDownListener = null;

    if (this.mouseDownListener) {
      this.element.nativeElement.removeEventListener('mousedown', this.mouseDownListener);
    }
    this.mouseDownListener = null;
  }

  private bindUsers(): User[] {
    const users = [...(this.value?.constraintData?.users || [])];
    users.push(...(this.value?.users || []).filter(user => !users.some(u => u.email === user.email)));
    return users;
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

  private onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const selectedOption = this.dropdown.getActiveOption();

        event.preventDefault();

        if (this.multi && event.code !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
          this.dropdown.resetActiveOption();
        } else {
          this.preventSaveAndBlur();
          const action = keyboardEventInputSaveAction(event);
          if (this.commonConfiguration?.delaySaveAction) {
            // needs to be executed after parent event handlers
            setTimeout(() => this.saveValue(action, selectedOption));
          } else {
            this.saveValue(action, selectedOption);
          }
        }
        return;
      case KeyCode.Escape:
        this.preventSaveAndBlur();
        this.resetScroll();
        this.resetSearchInput();
        this.cancel.emit();
        return;
      case KeyCode.Backspace:
        if (!this.name && this.multi && this.selectedUsers$.value.length > 0) {
          this.selectedUsers$.next(this.selectedUsers$.value.slice(0, this.selectedUsers$.value.length - 1));
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private toggleOption(option: DropdownOption) {
    if (this.selectedUsers$.value.some(o => o.email === option.value)) {
      this.selectedUsers$.next(this.selectedUsers$.value.filter(o => o.email !== option.value));
    } else {
      const selectUser = (this.users || []).find(o => o.email === option.value);
      if (selectUser) {
        this.selectedUsers$.next([...this.selectedUsers$.value, selectUser]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
    this.resetSearchInput();
  }

  private saveValue(action: DataInputSaveAction, activeOption?: DropdownOption) {
    const inputIsEmail = isEmailValid(this.name.trim());
    if (this.multi) {
      const selectedUser = activeOption && this.users.find(option => option.email === activeOption.value);
      if (selectedUser || !this.value.config.externalUsers || !inputIsEmail) {
        const options = [...this.selectedUsers$.value, selectedUser].filter(option => !!option);
        const emails = uniqueValues(options.map(option => option.email));
        const dataValue = this.value.copy(emails);
        this.save.emit({action, dataValue});
        return;
      }
    }

    if (activeOption || !this.name) {
      this.saveValueByOption(action, activeOption);
    } else if (
      this.name &&
      (this.commonConfiguration.skipValidation || (this.value.config && this.value.config.externalUsers)) &&
      inputIsEmail
    ) {
      if (this.multi) {
        const emails = uniqueValues([...this.selectedUsers$.value.map(option => option.email), this.name.trim()]);
        this.save.emit({action, dataValue: this.value.copy(emails)});
      } else {
        this.save.emit({action, dataValue: this.value.parseInput(this.name)});
      }
    } else {
      if (action === DataInputSaveAction.Enter) {
        this.enterInvalid.emit();
      } else {
        this.cancel.emit();
      }
    }
    this.resetSearchInput();
  }

  private saveValueByOption(action: DataInputSaveAction, option: DropdownOption) {
    const user = option && (this.users || []).find(u => (u.email || u.name) === option.value);
    const dataValue = this.value.copy(user ? user.email || user.name : '');
    this.save.emit({action, dataValue});
  }

  private resetSearchInput() {
    this.name = '';
  }

  public onInputChange() {
    const dataValue = this.value.parseInput(this.name);
    this.valueChange.emit(dataValue);
  }

  public onBlur() {
    this.removeListeners();
    this.resetScroll();
    if (this.preventSave) {
      this.preventSave = false;
      this.blurCleanup();
    } else if (this.multi) {
      this.saveValue(DataInputSaveAction.Blur);
    } else if (this.dropdown?.getActiveOption()) {
      this.saveValue(DataInputSaveAction.Blur, this.dropdown.getActiveOption());
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
      this.saveValue(DataInputSaveAction.Select, option);
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

  private onMouseDown(event: MouseEvent) {
    // prevent hide dropdown on mouse down (instead input)
    if (this.textInput && !this.textInput.nativeElement.contains(event.target as any)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }

  public trackByUser(index: number, user: User): string {
    return user.email || user.name;
  }
}
