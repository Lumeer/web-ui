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

import {AfterViewInit, Component, EventEmitter, HostListener, Input, Output} from '@angular/core';

import {ResourceType} from '../../../core/model/resource-type';
import {ResourceModel} from '../../../core/model/resource.model';
import {I18n} from '@ngx-translate/i18n-polyfill';

declare let $: any;

@Component({
  selector: 'resource-header',
  templateUrl: './resource-header.component.html',
  styleUrls: ['./resource-header.component.scss'],
})
export class ResourceHeaderComponent implements AfterViewInit {
  @Input() public resourceType: ResourceType;
  @Input() public resource: ResourceModel;
  @Input() public restrictedValues: string[];

  @Output() public codeChange: EventEmitter<string> = new EventEmitter();
  @Output() public nameChange: EventEmitter<string> = new EventEmitter();
  @Output() public descriptionChange: EventEmitter<string> = new EventEmitter();
  @Output() public iconChange: EventEmitter<string> = new EventEmitter();
  @Output() public colorChange: EventEmitter<string> = new EventEmitter();
  @Output() public delete = new EventEmitter();
  @Output() public back = new EventEmitter();

  public isDuplicate: boolean;

  private shouldEmitFirstLine: boolean;
  private oldIcon: string;
  private oldColor: string;
  private clickedComponent: any;
  private colorPickerVisible: boolean;

  constructor(private i18n: I18n) {}

  @HostListener('document:click', ['$event'])
  public documentClicked($event): void {
    if (this.colorPickerVisible && this.clickedComponent && $event.target !== this.clickedComponent) {
      this.resource.icon = this.oldIcon || this.resource.icon;
      this.resource.color = this.oldColor || this.resource.color;
      $event.stopPropagation();
    }
  }

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
    return this.i18n({
      id: 'resource.postit.code',
      value: 'Set code',
    });
  }

  public getNamePlaceholder(): string {
    return this.i18n({
      id: 'resource.postit.name',
      value: 'Fill in name',
    });
  }

  public getDescriptionPlaceholder(): string {
    return this.i18n({
      id: 'resource.description',
      value: 'Fill in description',
    });
  }

  public saveSelectedColor($event: MouseEvent): void {
    this.colorChange.emit(this.resource.color);
    this.iconChange.emit(this.resource.icon);
  }

  public revertSelectedColor($event: MouseEvent): void {
    this.resource.color = this.oldColor;
    this.resource.icon = this.oldIcon;
  }

  public storeIconAndColor($event: MouseEvent): void {
    this.clickedComponent = $event.target;
    this.oldColor = this.resource.color;
    this.oldIcon = this.resource.icon;
  }

  public ngAfterViewInit(): void {
    $('#dropdown-header').on('shown.bs.dropdown', () => {
      this.colorPickerVisible = true;
    });
    $('#dropdown-header').on('hidden.bs.dropdown', () => {
      this.colorPickerVisible = false;
    });
  }
}
