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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {ResourceType} from '../../../core/model/resource-type';
import {ResourceModel} from '../../../core/model/resource.model';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'resource-header',
  templateUrl: './resource-header.component.html',
  styleUrls: ['./resource-header.component.scss']

})
export class ResourceHeaderComponent {

  @Input() public resourceType: ResourceType;
  @Input() public resource: ResourceModel;

  @Output() codeChange: EventEmitter<string> = new EventEmitter();
  @Output() nameChange: EventEmitter<string> = new EventEmitter();
  @Output() descriptionChange: EventEmitter<string> = new EventEmitter();
  @Output() iconChange: EventEmitter<string> = new EventEmitter();
  @Output() colorChange: EventEmitter<string> = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() back = new EventEmitter();

  constructor(private i18n: I18n) {
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

  public onNewFirstLine(value: string) {
    if (this.hasVisibleCode()) {
      this.codeChange.emit(value);
    } else {
      this.nameChange.emit(value);
    }
  }

  public onNewSecondLine(value: string) {
    if (this.hasVisibleCode()) {
      this.nameChange.emit(value);
    }
  }

  public onNewColor(color: string) {
    this.colorChange.emit(color);
  }

  public onNewIcon(icon: string) {
    this.iconChange.emit(icon);
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
      value: 'Set code'
    });
  }

  public getNamePlaceholder(): string {
    return this.i18n({
      id: 'resource.postit.name',
      value: 'Fill in name'
    });
  }

  public getDescriptionPlaceholder(): string {
    return this.i18n({
      id: 'resource.description',
      value: 'Fill in description'
    });
  }

}
