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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, ElementRef, ViewChild} from '@angular/core';
import {User} from '../../../../../core/store/users/user';
import {environment} from '../../../../../../environments/environment';
import {DropdownComponent} from '../../../../dropdown/dropdown.component';
import {DropdownPosition} from '../../../../dropdown/dropdown-position';

@Component({
  selector: 'user-menu-dropdown',
  templateUrl: './user-menu-dropdown.component.html',
  styleUrls: ['./user-menu-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuDropdownComponent {
  @Input()
  public currentUser: User;

  @Input()
  public url: string;

  @Input()
  public freePlan: boolean;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Output()
  public startTour = new EventEmitter();

  @Output()
  public logout = new EventEmitter();

  @Output()
  public organizationDetail = new EventEmitter();

  @Output()
  public feedback = new EventEmitter();

  @ViewChild(DropdownComponent, {static: false})
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomEnd];

  public readonly buildNumber = environment.buildNumber;
  public readonly locale = environment.locale;

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }
}
