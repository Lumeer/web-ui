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

import {BehaviorSubject} from 'rxjs';

import {
  ConstraintType,
  UserDataValue,
  userDataValueCreateTeamValue,
  userDataValueIsTeamValue,
  userDataValueParseTeamValue,
} from '@lumeer/data-filters';
import {uniqueValues} from '@lumeer/utils';

import {USER_AVATAR_SIZE} from '../../../core/constants';
import {Team} from '../../../core/store/teams/team';
import {User} from '../../../core/store/users/user';
import {DropdownOption} from '../../dropdown/options/dropdown-option';
import {OptionsDropdownComponent} from '../../dropdown/options/options-dropdown.component';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {isEmailValid} from '../../utils/email.utils';
import {HtmlModifier, isElementActive} from '../../utils/html-modifier';
import {CommonDataInputConfiguration, UserDataInputConfiguration} from '../data-input-configuration';
import {DataInputSaveAction, keyboardEventInputSaveAction} from '../data-input-save-action';
import {constraintTypeClass} from '../pipes/constraint-class.pipe';
import {createUserDataInputTeams, createUserDataInputUsers} from './user-data-input-utils';

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
  public placeholder: string;

  @Input()
  public configuration: UserDataInputConfiguration;

  @Input()
  public fontColor: string;

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
  public teams: Team[];
  public selectedUsers$ = new BehaviorSubject<User[]>([]);
  public selectedTeams$ = new BehaviorSubject<Team[]>([]);
  public multi: boolean;
  public onlyIcon: boolean;

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
      this.preventSave = false;
    }
    if (changes.value && this.value) {
      this.selectedUsers$.next(this.value.users || []);
      this.selectedTeams$.next(this.value.teams || []);
      this.users = createUserDataInputUsers(this.value);
      this.teams = createUserDataInputTeams(this.value);
      this.multi = this.value.config?.multi;
      this.name = this.value.inputValue || '';
    }
    if (changes.readonly && this.readonly) {
      this.preventSaveAndBlur();
    }
    if (changes.value || changes.configuration) {
      this.onlyIcon = this.configuration?.onlyIcon || this.value?.config?.onlyIcon;
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
    switch (keyboardEventCode(event)) {
      case KeyCode.Enter:
      case KeyCode.NumpadEnter:
      case KeyCode.Tab:
        const selectedOption = this.dropdown?.getActiveOption();

        event.preventDefault();

        if (this.multi && keyboardEventCode(event) !== KeyCode.Tab && selectedOption) {
          event.stopImmediatePropagation();
          this.toggleOption(selectedOption);
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
        if (!this.name && this.multi) {
          if (this.selectedUsers$.value.length > 0) {
            this.removeLastUser();
          } else if (this.selectedTeams$.value.length > 0) {
            this.removeLastTeam();
          }
        }
        return;
    }

    this.dropdown.onKeyDown(event);
  }

  private removeLastUser() {
    this.selectedUsers$.next(this.selectedUsers$.value.slice(0, this.selectedUsers$.value.length - 1));
  }

  private removeLastTeam() {
    this.selectedTeams$.next(this.selectedTeams$.value.slice(0, this.selectedTeams$.value.length - 1));
  }

  private toggleOption(option: DropdownOption) {
    if (userDataValueIsTeamValue(option.value)) {
      this.toggleTeam(option);
    } else {
      this.toggleUser(option);
    }
    this.resetSearchInput();
  }

  private toggleTeam(option: DropdownOption) {
    const teamId = userDataValueParseTeamValue(option.value);
    if (this.selectedTeams$.value.some(team => team.id === teamId)) {
      this.selectedTeams$.next(this.selectedTeams$.value.filter(o => o.id !== teamId));
    } else {
      const selectedTeam = (this.teams || []).find(t => t.id === teamId);
      if (selectedTeam) {
        this.selectedTeams$.next([...this.selectedTeams$.value, selectedTeam]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
  }

  private toggleUser(option: DropdownOption) {
    if (this.selectedUsers$.value.some(o => o.email === option.value)) {
      this.selectedUsers$.next(this.selectedUsers$.value.filter(o => o.email !== option.value));
    } else {
      const selectUser = (this.users || []).find(o => o.email === option.value);
      if (selectUser) {
        this.selectedUsers$.next([...this.selectedUsers$.value, selectUser]);
        setTimeout(() => (this.wrapperElement.nativeElement.scrollLeft = Number.MAX_SAFE_INTEGER));
      }
    }
  }

  private saveValue(action: DataInputSaveAction, activeOption?: DropdownOption) {
    if (this.trySaveValueMulti(action, activeOption)) {
      return;
    }

    const inputIsEmail = isEmailValid(this.name.trim());
    if (activeOption || !this.name) {
      this.saveValueByOption(action, activeOption);
    } else if ((this.commonConfiguration?.skipValidation || this.value.config?.externalUsers) && inputIsEmail) {
      if (this.multi) {
        const newUsers = [...this.selectedUsers$.value, {email: this.name.trim()}];
        this.saveTeamsAndUsers(this.selectedTeams$.value, newUsers, action);
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

  private trySaveValueMulti(action: DataInputSaveAction, activeOption?: DropdownOption): boolean {
    if (this.multi) {
      if (activeOption && userDataValueIsTeamValue(activeOption.value)) {
        const teamId = userDataValueParseTeamValue(activeOption.value);
        const selectedTeam = this.teams.find(team => team.id === teamId);
        this.saveTeamsAndUsers([...this.selectedTeams$.value, selectedTeam], this.selectedUsers$.value, action);
        return true;
      }

      const inputIsEmail = isEmailValid(this.name.trim());
      const selectedUser = activeOption && this.users.find(option => option.email === activeOption.value);
      if (selectedUser || !this.value.config.externalUsers || !inputIsEmail) {
        this.saveTeamsAndUsers(this.selectedTeams$.value, [...this.selectedUsers$.value, selectedUser], action);
        return true;
      }
    }
    return false;
  }

  private saveTeamsAndUsers(teams: Team[], users: User[], action: DataInputSaveAction) {
    const teamsIds = (teams || []).filter(team => !!team).map(team => userDataValueCreateTeamValue(team.id));
    const userEmails = (users || []).filter(user => !!user).map(user => user.email);
    const values = [...teamsIds, ...userEmails];
    const dataValue = this.value.copy(uniqueValues(values));
    this.save.emit({action, dataValue});
  }

  private saveValueByOption(action: DataInputSaveAction, option: DropdownOption) {
    const dataValue = this.value.copy(option?.value || '');
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
    } else {
      this.cancel.emit();
    }
  }

  private resetScroll() {
    this.wrapperElement.nativeElement.scrollLeft = 0;
  }

  private preventSaveAndBlur() {
    if (isElementActive(this.textInput?.nativeElement)) {
      this.preventSave = true;
      this.textInput.nativeElement.blur();
      this.removeListeners();
    }
  }

  public onSelectOption(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
      this.dropdown?.resetActiveOption();
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
    return user.email || user.id || user.name;
  }

  public trackByTeam(index: number, team: Team): string {
    return team.id;
  }
}
