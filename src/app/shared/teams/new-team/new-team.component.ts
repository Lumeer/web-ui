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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Team} from '../../../core/store/teams/team';

@Component({
  selector: 'new-team',
  templateUrl: './new-team.component.html',
  styleUrls: ['./new-team.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTeamComponent {
  @Input()
  public teams: Team[];

  @Output()
  public teamCreated = new EventEmitter<string>();

  public name: string;
  public isDuplicate: boolean;
  public invalid: boolean;

  public onAddTeam() {
    const name = this.name.trim();
    if (name && !this.isDuplicate) {
      this.teamCreated.emit(name);
      this.clearInputs();
    }
  }

  public onInputChanged(value: string) {
    this.name = value;
    this.checkDuplicates();
  }

  public checkDuplicates() {
    const nameCleaned = this.name.trim();
    this.isDuplicate = this.teams.some(user => user.name.trim() === nameCleaned);
    this.invalid = nameCleaned.length === 0;
  }

  private clearInputs() {
    this.name = '';
  }
}
