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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {DashboardTab, isDashboardTabDefault} from '../../../../../core/model/dashboard-tab';

@Component({
  selector: 'dashboard-tab',
  templateUrl: './dashboard-tab.component.html',
  styleUrls: ['./dashboard-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabComponent implements OnChanges {
  @Input()
  public tab: DashboardTab;

  @Input()
  public selected: boolean;

  @Output()
  public toggleHidden = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  public isDefault: boolean;
  public readonly hideTitle: string;
  public readonly showTitle: string;

  constructor() {
    this.hideTitle = $localize`:@@search.tabs.settings.dialog.tab.hide:Hide tab`;
    this.showTitle = $localize`:@@search.tabs.settings.dialog.tab.show:Show tab`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tab) {
      this.isDefault = isDashboardTabDefault(this.tab);
    }
  }
}
