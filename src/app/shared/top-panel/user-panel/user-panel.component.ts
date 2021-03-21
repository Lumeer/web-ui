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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {User} from '../../../core/store/users/user';
import {selectCurrentUser} from '../../../core/store/users/users.state';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Component({
  selector: 'user-panel',
  templateUrl: './user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPanelComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  @Input()
  public controlsVisible: boolean;

  @Input()
  public mobile: boolean;

  @Input()
  public contentHeight: number;

  @Output()
  public toggleControls = new EventEmitter();

  public readonly showControls: boolean;

  public user$: Observable<User>;

  constructor(
    public element: ElementRef<HTMLElement>,
    private configurationService: ConfigurationService,
    private store$: Store<AppState>
  ) {
    this.showControls = !configurationService.getConfiguration().publicView;
  }

  public ngOnInit() {
    this.user$ = this.store$.pipe(select(selectCurrentUser));
  }
}
