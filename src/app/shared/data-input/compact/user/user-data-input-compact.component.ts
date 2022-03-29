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
import {USER_AVATAR_SIZE} from '../../../../core/constants';
import {uniqueValues} from '../../../utils/array.utils';
import {constraintTypeClass} from '../../pipes/constraint-class.pipe';
import {CommonDataInputConfiguration, UserDataInputConfiguration} from '../../data-input-configuration';
import {BehaviorSubject} from 'rxjs';
import {
  ConstraintType,
  UserDataValue,
  userDataValueCreateTeamValue,
  userDataValueIsTeamValue,
  userDataValueParseTeamValue,
} from '@lumeer/data-filters';
import {Team} from '../../../../core/store/teams/team';
import {createUserDataInputTeams, createUserDataInputUsers} from '../../user/user-data-input-utils';

@Component({
  selector: 'user-data-input-compact',
  templateUrl: './user-data-input-compact.component.html',
  styleUrls: ['./user-data-input-compact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDataInputCompactComponent implements OnChanges {
  @Input()
  public commonConfiguration: CommonDataInputConfiguration;

  @Input()
  public value: UserDataValue;

  @Input()
  public placeholder: string;

  @Input()
  public readonly: boolean;

  @Input()
  public configuration: UserDataInputConfiguration;

  @Output()
  public save = new EventEmitter<UserDataValue>();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild(OptionsDropdownComponent)
  public dropdown: OptionsDropdownComponent;

  public readonly avatarSize = USER_AVATAR_SIZE;
  public readonly inputClass = constraintTypeClass(ConstraintType.User);

  public users: User[];
  public teams: Team[];
  public selectedUsers$ = new BehaviorSubject<User[]>([]);
  public selectedTeams$ = new BehaviorSubject<Team[]>([]);
  public multi: boolean;
  public onlyIcon: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly) {
      this.checkDropdownState();
    }
    if (changes.value && this.value) {
      this.selectedUsers$.next(this.value.users || []);
      this.selectedTeams$.next(this.value.teams || []);
      this.users = createUserDataInputUsers(this.value);
      this.teams = createUserDataInputTeams(this.value);
      this.multi = this.value.config?.multi;
    }
    if (changes.value || changes.configuration) {
      this.onlyIcon = this.configuration?.onlyIcon || this.value?.config?.onlyIcon;
    }
  }

  private checkDropdownState() {
    if (this.readonly && this.dropdown?.isOpen()) {
      this.saveValue();
      this.dropdown.close();
    } else if (!this.readonly && (!this.dropdown || !this.dropdown?.isOpen())) {
      setTimeout(() => this.dropdown.open());
    }
  }

  public onDropdownClosed() {
    if (!this.readonly) {
      this.saveValue();
    }
  }

  private saveValue(activeOption?: DropdownOption) {
    if (this.multi) {
      const teamsIds = (this.selectedTeams$.value || [])
        .filter(team => !!team)
        .map(team => userDataValueCreateTeamValue(team.id));
      const userEmails = (this.selectedUsers$.value || []).filter(user => !!user).map(user => user.email);
      const values = uniqueValues([...teamsIds, ...userEmails]);
      const dataValue = this.value.copy(values);
      this.save.emit(dataValue);
    } else if (activeOption) {
      const dataValue = this.value.copy(activeOption ? activeOption?.value : '');
      this.save.emit(dataValue);
    } else {
      this.cancel.emit();
    }
  }

  public onSelect(option: DropdownOption) {
    if (this.multi) {
      this.toggleOption(option);
      this.dropdown?.resetActiveOption();
    } else {
      this.saveValue(option);
    }
  }

  private toggleOption(option: DropdownOption) {
    if (userDataValueIsTeamValue(option.value)) {
      this.toggleTeam(option);
    } else {
      this.toggleUser(option);
    }
  }

  private toggleUser(option: DropdownOption) {
    if (this.selectedUsers$.value.some(o => o.email === option.value)) {
      this.selectedUsers$.next(this.selectedUsers$.value.filter(o => o.email !== option.value));
    } else {
      const selectUser = (this.users || []).find(o => o.email === option.value);
      if (selectUser) {
        this.selectedUsers$.next([...this.selectedUsers$.value, selectUser]);
      }
    }
  }

  private toggleTeam(option: DropdownOption) {
    const teamId = userDataValueParseTeamValue(option.value);
    if (this.selectedTeams$.value.some(team => team.id === teamId)) {
      this.selectedTeams$.next(this.selectedTeams$.value.filter(o => o.id !== teamId));
    } else {
      const selectedTeam = (this.teams || []).find(t => t.id === teamId);
      if (selectedTeam) {
        this.selectedTeams$.next([...this.selectedTeams$.value, selectedTeam]);
      }
    }
  }

  public trackByUser(index: number, user: User): string {
    return user.email || user.id || user.name;
  }

  public trackByTeam(index: number, team: Team): string {
    return team.id;
  }
}
