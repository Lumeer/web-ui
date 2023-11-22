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
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Collection, ImportType} from '../../../../core/store/collections/collection';
import {findAttribute, getDefaultAttributeId} from '../../../../core/store/collections/collection.util';
import {resourceAttributesSelectItems} from '../../../select/select-item.utils';
import {SelectItemModel} from '../../../select/select-item/select-item.model';

@Component({
  selector: 'collection-upload-body',
  templateUrl: './collection-upload-body.component.html',
  styleUrls: ['./collection-upload-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionUploadBodyComponent implements OnChanges {
  @Input()
  public form: FormGroup;

  @Input()
  public collection: Collection;

  @Input()
  public permissions: AllowedPermissions;

  public readonly importType = ImportType;

  private readonly importItemsMap: Record<ImportType, SelectItemModel> = {
    [ImportType.Append]: {
      id: ImportType.Append,
      value: $localize`:@@collection.import.type.append:Append`,
      icons: ['fa fa-2x fa-plus'],
    },
    [ImportType.Update]: {
      id: ImportType.Update,
      value: $localize`:@@collection.import.type.merge:Update`,
      icons: ['fa fa-2x fa-merge'],
    },
    [ImportType.Replace]: {
      id: ImportType.Replace,
      value: $localize`:@@collection.import.type.overwrite:Replace`,
      icons: ['fa fa-2x fa-pencil'],
    },
  };

  public collectionSelectItems: SelectItemModel[] = [];
  public importItems: SelectItemModel[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.collectionSelectItems = resourceAttributesSelectItems(this.collection);
      this.checkMergeAttribute();
    }
    if (changes.permissions) {
      this.importItems = this.filterImportItems();
      this.checkSelectedType();
    }
  }

  private filterImportItems(): SelectItemModel[] {
    const items = [this.importItemsMap[ImportType.Append]];

    if (this.permissions?.roles?.DataWrite) {
      items.push(this.importItemsMap[ImportType.Update]);
    }
    if (this.permissions?.roles?.DataDelete) {
      items.push(this.importItemsMap[ImportType.Replace]);
    }

    return items;
  }

  private checkMergeAttribute() {
    if (!this.mergeAttributeIdControl.value) {
      const defaultAttributeId = getDefaultAttributeId(this.collection);
      const defaultAttribute = defaultAttributeId && findAttribute(this.collection?.attributes, defaultAttributeId);
      if (defaultAttribute) {
        this.mergeAttributeIdControl.setValue(defaultAttribute.id);
      }
    }
  }

  private checkSelectedType() {
    if (!this.importItems.some(item => item.id === this.typeControl.value)) {
      this.typeControl.setValue(this.importItems[0].id);
    }
  }

  public get typeControl(): AbstractControl {
    return this.form.controls.type;
  }

  public get mergeAttributeIdControl(): AbstractControl {
    return this.form.controls.mergeAttributeId;
  }

  public setType(type: ImportType) {
    if (type === this.typeControl.value) {
      return;
    }
    this.typeControl.setValue(type);
  }

  public onSelectAttribute(value: any) {
    this.mergeAttributeIdControl.setValue(value);
  }
}
