/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, OnDestroy, OnInit, Output} from '@angular/core';

@Component({
  selector: 'loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingIndicatorComponent implements OnInit, OnDestroy {
  @Output()
  public hide = new EventEmitter();

  private hidingEnabled: boolean;
  private hidingTimeoutId: number;

  public ngOnInit() {
    this.enableHidingAfterTwoSeconds();
  }

  private enableHidingAfterTwoSeconds() {
    this.hidingTimeoutId = window.setTimeout(() => (this.hidingEnabled = true), 2000);
  }

  public ngOnDestroy() {
    window.clearTimeout(this.hidingTimeoutId);
  }

  @HostListener('click')
  public onClick() {
    if (this.hidingEnabled) {
      this.hide.emit();
    }
  }
}
