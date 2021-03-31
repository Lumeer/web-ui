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
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {perspectiveIconsMap} from '../../../../perspective';
import {View} from '../../../../../../core/store/views/view';
import {QueryData} from '../../../../../../shared/top-panel/search-box/util/query-data';
import {QueryItem} from '../../../../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemsConverter} from '../../../../../../shared/top-panel/search-box/query-item/query-items.converter';
import {ResourceType} from '../../../../../../core/model/resource-type';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';

@Component({
  selector: 'view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDetailComponent implements OnInit, OnChanges {
  @Input()
  public view: View;

  @Input()
  public queryData: QueryData;

  @Input()
  public viewSize: SizeType;

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public clicked = new EventEmitter();

  @Output()
  public delete = new EventEmitter();

  @Output()
  public favoriteToggle = new EventEmitter();

  public queryItems: QueryItem[] = [];

  public readonly viewType = ResourceType.View;
  public readonly sizeType = SizeType;

  public icon: string;

  public constructor(private modalService: ModalService) {}

  public ngOnInit() {
    this.createQueryItems();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryData || changes.view) {
      this.createQueryItems();
    }
    if (changes.view) {
      this.icon = perspectiveIconsMap[this.view?.perspective] || '';
    }
  }

  public onClicked() {
    this.clicked.emit();
  }

  public trackByQueryItem(index: number, queryItem: QueryItem): string {
    return `${queryItem.type}:${queryItem.value}`;
  }

  public onDelete() {
    this.delete.emit();
  }

  private createQueryItems() {
    if (this.queryData) {
      this.queryItems = new QueryItemsConverter(this.queryData).fromQuery(this.view.query);
    }
  }

  public onShareClick() {
    this.modalService.showShareView(this.view);
  }

  public onFavoriteToggle() {
    this.favoriteToggle.emit();
  }
}
