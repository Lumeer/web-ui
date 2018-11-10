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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'collapsible-sidebar',
  templateUrl: './collapsible-sidebar.component.html',
  styleUrls: ['./collapsible-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleSidebarComponent implements OnChanges {
  @Input()
  public collapsed = false;

  @Input()
  public collapsible = true;

  @Input()
  public width = 300;

  public collapsed$ = new BehaviorSubject(false);

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collapsed) {
      this.collapsed$.next(this.collapsed);
    }
  }

  public onToggle() {
    this.collapsed$.next(!this.collapsed$.getValue());
  }
}
