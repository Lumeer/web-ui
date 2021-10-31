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
import {FormAttributeCellConfig, FormCell, FormCellType} from '../../../../../../../core/store/form/form-model';
import {Collection} from '../../../../../../../core/store/collections/collection';
import {SelectItem2Model} from '../../../../../../../shared/select/select-item2/select-item2.model';
import {AttributesResourceType} from '../../../../../../../core/model/resource';
import {objectChanged} from '../../../../../../../shared/utils/common.utils';

@Component({
  selector: 'form-editor-cell',
  templateUrl: './form-editor-cell.component.html',
  styleUrls: ['./form-editor-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormEditorCellComponent implements OnChanges {

  @Input()
  public cell: FormCell;

  @Input()
  public collection: Collection;

  @Output()
  public cellChange = new EventEmitter<FormCell>();

  public selectedItemPath: string[];
  public items: SelectItem2Model[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.collection) {
      this.items = this.mapItems();
    }
    if (changes.cell || objectChanged(changes.collection)) {
      this.selectedItemPath = this.mapSelectedItem();
    }
  }

  private mapSelectedItem(): string[] {
    if (this.cell?.type === FormCellType.Attribute) {
      const config = <FormAttributeCellConfig>this.cell?.config || {};
      if (config.resourceId === this.collection?.id && config.resourceType === AttributesResourceType.Collection) {
        return [FormCellType.Attribute, config.attributeId];
      }
    }

    return [];
  }

  private mapItems(): SelectItem2Model[] {
    return [this.createAttributeItem()];
  }

  private createAttributeItem(): SelectItem2Model {
    const attributeItems: SelectItem2Model[] = (this.collection?.attributes || [])
      .map(attribute => ({id: attribute.id, value: attribute.name, icons: [this.collection?.icon], iconColors: [this.collection?.color]}))

    return {
      id: FormCellType.Attribute,
      value: $localize`:@@perspective.form.editor.row.cell.attribute:Attribute`,
      children: attributeItems
    };
  }

  public onSelectPath(path: SelectItem2Model[]) {
    if (path.length < 2) {
      return;
    }

    switch (path[0].id) {
      case FormCellType.Attribute:
        this.onSelectAttribute(path[1]);
        break;
    }
  }

  private onSelectAttribute(item: SelectItem2Model) {
    const copyConfig = this.cell?.type === FormCellType.Attribute ? this.cell?.config : {};
    const config: FormAttributeCellConfig = {
      ...copyConfig,
      attributeId: item.id,
      resourceType: AttributesResourceType.Collection,
      resourceId: this.collection?.id,
    };
    const newCell: FormCell = {...this.cell, config, type: FormCellType.Attribute};
    this.cellChange.emit(newCell);
  }
}
