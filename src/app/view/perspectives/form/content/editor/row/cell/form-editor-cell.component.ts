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
import {
  FormAttributeCellConfig,
  FormCell,
  FormCellConfig,
  FormCellType,
  FormLinkCellConfig,
} from '../../../../../../../core/store/form/form-model';
import {Attribute, Collection} from '../../../../../../../core/store/collections/collection';
import {
  SelectedItemDisplayValue,
  SelectItem2Model,
} from '../../../../../../../shared/select/select-item2/select-item2.model';
import {AttributesResourceType} from '../../../../../../../core/model/resource';
import {COLOR_GRAY700} from '../../../../../../../core/constants';
import {LinkType} from '../../../../../../../core/store/link-types/link.type';

@Component({
  selector: 'form-editor-cell',
  templateUrl: './form-editor-cell.component.html',
  styleUrls: ['./form-editor-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorCellComponent implements OnChanges {
  @Input()
  public cell: FormCell;

  @Input()
  public collection: Collection;

  @Input()
  public collectionLinkTypes: LinkType[];

  @Input()
  public usedAttributeIds: string[];

  @Input()
  public usedLinkTypeIds: string[];

  @Output()
  public cellChange = new EventEmitter<FormCell>();

  public readonly type = FormCellType;
  public readonly displayValue = SelectedItemDisplayValue;
  public readonly descriptionColor = COLOR_GRAY700;

  public selectedItemPath: string[];
  public items: SelectItem2Model[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.cell || changes.collection || changes.usedAttributesIds || changes.usedLinkTypeIds) {
      this.items = this.mapItems();
    }
    if (changes.cell || changes.collection) {
      this.selectedItemPath = this.mapSelectedItem();
    }
  }

  private mapSelectedItem(): string[] {
    switch (this.cell?.type) {
      case FormCellType.Attribute:
        return this.mapAttributeItem();
      case FormCellType.Link:
        return this.mapLinkItem();
      default:
        return [];
    }
  }

  private mapAttributeItem(): string[] {
    const attribute = this.getSelectedAttribute();
    return attribute ? [FormCellType.Attribute, attribute.id] : [];
  }

  private getSelectedAttribute(): Attribute {
    const config = <FormAttributeCellConfig>this.cell?.config || {};
    if (config.resourceId !== this.collection?.id || config.resourceType !== AttributesResourceType.Collection) {
      return null;
    }
    return this.collection?.attributes?.find(attribute => attribute.id === config.attributeId);
  }

  private mapLinkItem(): string[] {
    const link = this.getSelectedLink();
    return link ? [FormCellType.Link, link.id] : [];
  }

  private getSelectedLink(): LinkType {
    const config = <FormLinkCellConfig>this.cell?.config || {};
    return this.collectionLinkTypes?.find(link => link.id === config.linkTypeId);
  }

  private mapItems(): SelectItem2Model[] {
    return [
      this.createAttributeItem(removeSelectedAttributeIdFromRestricted(this.usedAttributeIds, this.cell)),
      this.createLinkItem(removeSelectedLinkIdFromRestricted(this.usedLinkTypeIds, this.cell)),
    ];
  }

  private createAttributeItem(restrictedAttributesIds: string[]): SelectItem2Model {
    const attributeItems: SelectItem2Model[] = (this.collection?.attributes || [])
      .filter(attribute => !restrictedAttributesIds?.includes(attribute.id))
      .map(attribute => ({
        id: attribute.id,
        value: attribute.name,
        icons: [this.collection?.icon],
        iconColors: [this.collection?.color],
      }));

    if (attributeItems.length === 0) {
      attributeItems.push({
        id: '',
        disabled: true,
        value: $localize`:@@perspective.form.editor.row.cell.attribute.empty:No Attributes found`,
      });
    }

    return {
      id: FormCellType.Attribute,
      value: $localize`:@@perspective.form.editor.row.cell.attribute:Attribute`,
      children: attributeItems,
    };
  }

  private createLinkItem(restrictedIds: string[]): SelectItem2Model {
    const items: SelectItem2Model[] = (this.collectionLinkTypes || [])
      .filter(attribute => !restrictedIds?.includes(attribute.id))
      .map(linkType => ({
        id: linkType.id,
        value: linkType.name,
        icons: linkType.collections?.map(collection => collection.icon) as [string, string],
        iconColors: linkType.collections?.map(collection => collection.color) as [string, string],
      }));

    if (items.length === 0) {
      items.push({
        id: '',
        disabled: true,
        value: $localize`:@@perspective.form.editor.row.cell.link.empty:No Link Types found`,
      });
    }

    return {
      id: FormCellType.Link,
      value: $localize`:@@perspective.form.editor.row.cell.link:Link Type`,
      children: items,
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
      case FormCellType.Link:
        this.onSelectLink(path[1]);
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
    const title = this.checkSelectedItemTitle(item);
    const newCell: FormCell = {...this.cell, title, config, type: FormCellType.Attribute};
    this.cellChange.emit(newCell);
  }

  private checkSelectedItemTitle(item: SelectItem2Model): string {
    if (this.currentSelectedItemTitle() === this.cell?.title) {
      return item.value;
    }

    return this.cell?.title || item.value;
  }

  private currentSelectedItemTitle(): string {
    switch (this.cell?.type) {
      case FormCellType.Attribute:
        return this.getSelectedAttribute()?.name;
      case FormCellType.Link:
        return this.getSelectedLink()?.name;
      default:
        return '';
    }
  }

  private onSelectLink(item: SelectItem2Model) {
    const copyConfig = this.cell?.type === FormCellType.Link ? this.cell?.config : {};
    const config: FormLinkCellConfig = {
      ...copyConfig,
      linkTypeId: item.id,
    };
    const title = this.checkSelectedItemTitle(item);
    const newCell: FormCell = {...this.cell, title, config, type: FormCellType.Link};
    this.cellChange.emit(newCell);
  }

  public onNewTitle(title: string) {
    const newCell: FormCell = {...this.cell, title};
    this.cellChange.emit(newCell);
  }

  public onNewDescription(description: string) {
    const newCell: FormCell = {...this.cell, description};
    this.cellChange.emit(newCell);
  }

  public onConfigChange(config: FormCellConfig) {
    const newCell: FormCell = {...this.cell, config};
    this.cellChange.emit(newCell);
  }

  public onRemovePath() {
    const newCell: FormCell = {...this.cell, config: {}, type: undefined, title: '', description: ''};
    this.cellChange.emit(newCell);
  }
}

function removeSelectedAttributeIdFromRestricted(ids: string[], cell: FormCell): string[] {
  if (cell.type === FormCellType.Attribute) {
    const attributeId = (<FormAttributeCellConfig>cell.config)?.attributeId;
    return (ids || []).filter(id => id !== attributeId);
  }
  return ids;
}

function removeSelectedLinkIdFromRestricted(ids: string[], cell: FormCell): string[] {
  if (cell.type === FormCellType.Link) {
    const linkTypeId = (<FormLinkCellConfig>cell.config)?.linkTypeId;
    return (ids || []).filter(id => id !== linkTypeId);
  }
  return ids;
}
