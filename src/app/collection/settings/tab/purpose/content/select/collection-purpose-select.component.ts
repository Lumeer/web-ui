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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';
import {objectValues} from '../../../../../../shared/utils/common.utils';
import {collectionPurposesIcons, CollectionPurposeType} from '../../../../../../core/store/collections/collection';
import {parseSelectTranslation} from '../../../../../../shared/utils/translation.utils';

@Component({
  selector: 'collection-purpose-select',
  templateUrl: './collection-purpose-select.component.html',
  styleUrls: ['collection-purpose-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPurposeSelectComponent implements OnInit {
  @Input()
  public type: CollectionPurposeType;

  @Output()
  public typeChange = new EventEmitter<CollectionPurposeType>();

  public readonly types = CollectionPurposeType;

  public items: SelectItemModel[];

  public ngOnInit() {
    this.items = this.createSelectItems();
  }

  private createSelectItems(): SelectItemModel[] {
    const result: SelectItemModel[] = objectValues(CollectionPurposeType).map(type => ({
      id: type,
      value: parseSelectTranslation($localize`:@@tasks.type:{type, select, None {Generic} Tasks {Tasks}}`, {type}),
      icons: [collectionPurposesIcons[type]],
    }));

    result.sort((a, b) => {
      return a.id === CollectionPurposeType.None
        ? -1
        : b.id === CollectionPurposeType.None
        ? 1
        : a.value.localeCompare(b.value);
    });

    return result;
  }

  public onSelect(type: CollectionPurposeType) {
    this.typeChange.emit(type);
  }
}
