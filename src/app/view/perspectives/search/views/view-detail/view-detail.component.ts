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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {perspectiveIconsMap} from '../../../perspective';
import {ViewModel} from '../../../../../core/store/views/view.model';
import {QueryData} from '../../../../../shared/search-box/query-data';
import {QueryItem} from '../../../../../shared/search-box/query-item/model/query-item';
import {QueryItemsConverter} from '../../../../../shared/search-box/query-item/query-items.converter';

@Component({
  selector: 'view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss']
})
export class ViewDetailComponent implements OnInit {

  @Input()
  public view: ViewModel;

  @Input()
  public queryData: QueryData;

  @Output()
  public clicked = new EventEmitter();

  public queryItems: QueryItem[] = [];

  public ngOnInit() {
      this.createQueryItems();
  }

  public getIconForPerspective(perspective: string): string {
    return perspectiveIconsMap[perspective] || '';
  }

  public onClicked() {
    this.clicked.emit();
  }

  private createQueryItems() {
    if (!this.queryData) {
      return;
    }
    this.queryItems = new QueryItemsConverter(this.queryData).fromQuery(this.view.query);
  }
}
