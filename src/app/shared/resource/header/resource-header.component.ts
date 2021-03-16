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

import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {ResourceType} from '../../../core/model/resource-type';
import {Resource} from '../../../core/model/resource';
import {IconColorPickerComponent} from '../../picker/icon-color/icon-color-picker.component';

@Component({
  selector: 'resource-header',
  templateUrl: './resource-header.component.html',
  styleUrls: ['./resource-header.component.scss'],
})
export class ResourceHeaderComponent {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resource: Resource;

  @Input()
  public restrictedValues: string[];

  @Output()
  public codeChange: EventEmitter<string> = new EventEmitter();

  @Output()
  public nameChange: EventEmitter<string> = new EventEmitter();

  @Output()
  public descriptionChange: EventEmitter<string> = new EventEmitter();

  @Output()
  public colorIconChange: EventEmitter<{color: string; icon: string}> = new EventEmitter();

  @Output()
  public delete = new EventEmitter();

  @Output()
  public back = new EventEmitter();

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public isDuplicate: boolean;

  private shouldEmitFirstLine: boolean;

  public hasVisibleCode(): boolean {
    return [ResourceType.Organization, ResourceType.Project].includes(this.resourceType);
  }

  public onBack() {
    this.back.emit();
  }

  public onDelete() {
    this.delete.emit();
  }

  public onFirstLineBlur() {
    this.shouldEmitFirstLine = true;
  }

  public onFirstLineFocus() {
    this.shouldEmitFirstLine = false;
  }

  public onNewFirstLine(value: string) {
    if (this.shouldEmitFirstLine) {
      this.emitFirstLine(value);
    } else {
      this.checkDuplicate(value);
    }
  }

  private emitFirstLine(value: string) {
    if (!this.isDuplicate) {
      if (this.hasVisibleCode()) {
        this.codeChange.emit(value);
      } else {
        this.nameChange.emit(value);
      }
    }
    this.shouldEmitFirstLine = false;
  }

  private checkDuplicate(value: string) {
    this.isDuplicate = !!(this.restrictedValues || []).find(restrictedValue => restrictedValue === value);
  }

  public onNewSecondLine(value: string) {
    if (this.hasVisibleCode()) {
      this.nameChange.emit(value);
    }
  }

  public onNewDescription(description: string) {
    this.descriptionChange.emit(description);
  }

  public firstLinePlaceholder(): string {
    if (this.hasVisibleCode()) {
      return this.getCodePlaceholder();
    } else {
      return this.getNamePlaceholder();
    }
  }

  public secondLinePlaceholder(): string {
    if (this.hasVisibleCode()) {
      return this.getNamePlaceholder();
    }
    return null;
  }

  public firstLineValue(): string {
    if (this.hasVisibleCode()) {
      return this.resource.code;
    } else {
      return this.resource.name;
    }
  }

  public secondLineValue(): string {
    if (this.hasVisibleCode()) {
      return this.resource.name;
    }
    return null;
  }

  public getCodePlaceholder(): string {
    return $localize`:@@resource.postit.code:Set code`;
  }

  public getNamePlaceholder(): string {
    return $localize`:@@resource.postit.name:Fill in name`;
  }

  public getFilter(): RegExp {
    if (this.hasVisibleCode()) {
      return /[^_0-9A-Za-z]/g;
    } else {
      return /\./g;
    }
  }

  public togglePicker() {
    this.iconColorDropdownComponent.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.resource.icon = data.icon;
    this.resource.color = data.color;
  }

  public onIconColorSubmit(data: {icon: string; color: string}) {
    this.colorIconChange.emit(data);
  }
}
