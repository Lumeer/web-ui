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

import {getViewColor} from '@lumeer/data-filters';
import {objectsByIdMap} from '@lumeer/utils';

import {AllowedPermissions} from '../../../../../../core/model/allowed-permissions';
import {Workspace} from '../../../../../../core/store/navigation/workspace';
import {View} from '../../../../../../core/store/views/view';
import {getViewIcon} from '../../../../../../core/store/views/view.utils';
import {ModalService} from '../../../../../../shared/modal/modal.service';
import {SizeType} from '../../../../../../shared/slider/size/size-type';
import {QueryItem} from '../../../../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemsConverter} from '../../../../../../shared/top-panel/search-box/query-item/query-items.converter';
import {QueryData} from '../../../../../../shared/top-panel/search-box/util/query-data';
import {filterVisibleAttributesInQueryItems} from '../../../../../../shared/top-panel/search-box/util/search-box.util';

@Component({
  selector: 'view-detail',
  templateUrl: './view-detail.component.html',
  styleUrls: ['./view-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewDetailComponent implements OnChanges {
  @Input()
  public view: View;

  @Input()
  public queryData: QueryData;

  @Input()
  public viewSize: SizeType;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public workspace: Workspace;

  @Output()
  public favoriteToggle = new EventEmitter();

  public queryItems: QueryItem[] = [];

  public readonly sizeType = SizeType;

  public color: string;
  public icon: string;
  public path: any[];

  public constructor(private modalService: ModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.queryData || changes.view || changes.permissions) {
      this.createQueryItems();
    }
    if (changes.queryData || changes.view) {
      this.color = getViewColor(this.view, objectsByIdMap(this.queryData?.collections));
    }
    if (changes.view) {
      this.icon = getViewIcon(this.view);
    }
    if (changes.view || changes.workspace) {
      this.path = ['/w', this.workspace?.organizationCode, this.workspace?.projectCode, 'view', {vc: this.view.code}];
    }
  }

  public trackByQueryItem(index: number, queryItem: QueryItem): string {
    return `${queryItem.type}:${queryItem.value}`;
  }

  public onSettings() {
    this.modalService.showViewSettings(this.view);
  }

  private createQueryItems() {
    this.queryItems = filterVisibleAttributesInQueryItems(
      new QueryItemsConverter(this.queryData).fromQuery(this.view.query),
      this.permissions,
      this.view
    );
  }

  public onShareClick() {
    this.modalService.showShareView(this.view);
  }

  public onFavoriteToggle() {
    this.favoriteToggle.emit();
  }
}
