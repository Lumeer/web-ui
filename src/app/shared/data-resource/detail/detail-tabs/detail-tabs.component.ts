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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {DetailTabType} from '../detail-tab-type';

@Component({
  selector: 'detail-tabs',
  templateUrl: './detail-tabs.component.html',
  styleUrls: ['./detail-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailTabsComponent implements OnChanges {
  @Input()
  public activeTab: DetailTabType;

  @Input()
  public showLinks: boolean;

  @Input()
  public showTables: boolean;

  @Input()
  public showActivity: boolean;

  @Input()
  public showComments: boolean;

  @Input()
  public commentsCount: number;

  @Input()
  public linksCount: number;

  @Input()
  public documentsCount: number;

  @Output()
  public onTabSelect = new EventEmitter<DetailTabType>();

  public readonly detailTabTypes = DetailTabType;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.showLinks && !this.showLinks && this.activeTab === DetailTabType.Links) {
      this.resetTabActive();
    }
    if (changes.showTables && !this.showTables && this.activeTab === DetailTabType.Tables) {
      this.resetTabActive();
    }
    if (changes.showActivity && !this.showActivity && this.activeTab === DetailTabType.Activity) {
      this.resetTabActive();
    }
    if (changes.showComments && !this.showComments && this.activeTab === DetailTabType.Comments) {
      this.resetTabActive();
    }
  }

  private resetTabActive() {
    setTimeout(() => this.onTabSelect.emit(DetailTabType.Detail));
  }
}
