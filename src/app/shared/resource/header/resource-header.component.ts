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
  ViewChild,
} from '@angular/core';

import {ResourceType} from '../../../core/model/resource-type';
import {Resource} from '../../../core/model/resource';
import {IconColorPickerComponent} from '../../picker/icon-color/icon-color-picker.component';
import {parseSelectTranslation} from '../../utils/translation.utils';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {TRIM_REGEX} from '../../input/input-box/input-box.component';

@Component({
  selector: 'resource-header',
  templateUrl: './resource-header.component.html',
  styleUrls: ['./resource-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceHeaderComponent implements OnInit, OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public resource: Resource;

  @Input()
  public permissions: AllowedPermissions;

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
  public deleteTitle: string;
  public codeVisible: boolean;
  public descriptionVisible: boolean;
  public firstLinePlaceholder: string;
  public secondLinePlaceholder: string;
  public firstLineValue: string;
  public secondLineValue: string;
  public firstLineFilter: RegExp;
  public secondLineFilter: RegExp;

  private shouldEmitFirstLine: boolean;

  public hasVisibleCode(): boolean {
    return [ResourceType.Organization, ResourceType.Project].includes(this.resourceType);
  }

  public hasVisibleDescription(): boolean {
    return [ResourceType.Organization, ResourceType.Project, ResourceType.Collection, ResourceType.View].includes(
      this.resourceType
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource) {
      this.checkValues();
    }
  }

  private checkValues() {
    this.codeVisible = this.hasVisibleCode();
    this.descriptionVisible = this.hasVisibleDescription();
    if (this.codeVisible) {
      this.firstLinePlaceholder = this.getCodePlaceholder();
      this.secondLinePlaceholder = this.getNamePlaceholder();
      this.firstLineValue = this.resource.code;
      this.secondLineValue = this.resource.name;
      this.firstLineFilter = /[^_0-9A-Za-z]/g;
      this.secondLineFilter = TRIM_REGEX;
    } else {
      this.firstLinePlaceholder = this.getNamePlaceholder();
      this.secondLinePlaceholder = null;
      this.firstLineValue = this.resource.name;
      this.secondLineValue = null;
      this.firstLineFilter = /\./g;
      this.secondLineFilter = /\./g;
    }
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
      // TODO
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

  public onNewSecondLine(value: string) {
    if (this.hasVisibleCode()) {
      this.nameChange.emit(value);
    }
  }

  public onNewDescription(description: string) {
    this.descriptionChange.emit(description);
  }

  public getCodePlaceholder(): string {
    return $localize`:@@resource.postit.code:Set code`;
  }

  public getNamePlaceholder(): string {
    return $localize`:@@resource.postit.name:Fill in name`;
  }

  public togglePicker() {
    this.iconColorDropdownComponent?.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.resource.icon = data.icon;
    this.resource.color = data.color;
  }

  public onIconColorSubmit(data: {icon: string; color: string}) {
    this.colorIconChange.emit(data);
  }

  public ngOnInit() {
    this.deleteTitle = parseSelectTranslation(
      $localize`:@@resource.settings.deleteResource.title:Permanently remove this {resourceType, select, organization {organization} project {project} collection {table} link {link} view {view} document {record}}`,
      {resourceType: this.resourceType}
    );
  }
}
