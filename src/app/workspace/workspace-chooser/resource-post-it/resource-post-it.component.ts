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

import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {Resource} from '../../../core/model/resource';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Role} from '../../../core/model/role';
import {ServiceLevelType} from '../../../core/dto/service-level-type';
import {isNullOrUndefined} from 'util';
import {InputBoxComponent} from '../../../shared/input/input-box/input-box.component';
import {ResourceType} from '../../../core/model/resource-type';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../core/constants';
import {animateVisible} from '../../../shared/animations';

@Component({
  selector: 'resource-post-it',
  templateUrl: './resource-post-it.component.html',
  styleUrls: ['./resource-post-it.component.scss'],
  animations: [animateVisible],
})
export class ResourcePostItComponent {
  @ViewChild('icon')
  public icon: ElementRef;

  @Input() public resourceType: ResourceType;
  @Input() public resource: Resource;
  @Input() public roles: string[];
  @Input() public isSelected: boolean;
  @Input() public serviceLevel: ServiceLevelType;
  @Input() public restrictedCodes: string[];

  @Output() public select = new EventEmitter();
  @Output() public settings = new EventEmitter();
  @Output() public delete = new EventEmitter();
  @Output() public warningMessage = new EventEmitter<string>();
  @Output() public create = new EventEmitter<Resource>();
  @Output() public update = new EventEmitter<Resource>();

  public isPickerVisible = false;

  private codeHasFocus = false;
  private nameHasFocus = false;
  private lastIcon: string;
  private lastColor: string;

  public constructor(private i18n: I18n) {}

  public onSelected() {
    this.select.emit();
  }

  public hasServiceLevel(): boolean {
    return !isNullOrUndefined(this.serviceLevel);
  }

  public hasManageRole(): boolean {
    return this.roles && this.roles.includes(Role.Manage);
  }

  public isFreeServiceLevel(): boolean {
    return this.serviceLevel === ServiceLevelType.FREE;
  }

  public getIdentificator() {
    return this.resource.id || this.resource.correlationId;
  }

  public onSettings() {
    this.settings.emit();
  }

  public onDelete() {
    this.delete.emit();
  }

  public onPickerClick() {
    if (this.isPickerVisible) {
      this.onPickerBlur();
    } else {
      this.isPickerVisible = true;
      this.lastIcon = null;
      this.lastColor = null;
    }
  }

  public onPickerBlur() {
    if (!this.isPickerVisible) {
      return;
    }

    if (this.resource.id) {
      if (this.shouldUpdateIcons()) {
        const resourceModel = {
          ...this.resource,
          icon: this.lastIcon || this.resource.icon,
          color: this.lastColor || this.resource.color,
        };
        this.update.emit(resourceModel);
      }
    } else {
      this.scheduleCheck();
    }

    this.isPickerVisible = false;
  }

  private shouldUpdateIcons(): boolean {
    return (
      (this.lastIcon && this.resource.icon !== this.lastIcon) ||
      (this.lastColor && this.resource.color !== this.lastColor)
    );
  }

  public showPicker() {
    if (this.icon) {
      this.icon.nativeElement.click();
    }
  }

  public onNewColor(color: string) {
    if (this.resource.id) {
      this.lastColor = color;
    } else {
      this.resource.color = color;
    }
  }

  public onNewIcon(icon: string) {
    if (this.resource.id) {
      this.lastIcon = icon;
    } else {
      this.resource.icon = icon;
    }
  }

  public onCodeFocus() {
    this.codeHasFocus = true;
  }

  public onNameFocus() {
    this.nameHasFocus = true;
  }

  public onCodeBlur(component: InputBoxComponent, newCode: string) {
    this.codeHasFocus = false;

    const isValid = this.isNewCodeValid(newCode);
    if (isValid) {
      component.removeWarningBorder();
    } else {
      component.setWarningBorder();

      const message = this.i18n(
        {
          id: 'resource.already.exist',
          value:
            '{resourceType, select, Project {Project} Organization {Organization}} with code {{resourceCode}} already exist',
        },
        {
          resourceType: this.resourceType,
          resourceCode: newCode,
        }
      );
      this.warningMessage.emit(message);
      return;
    }

    if (this.resource.id) {
      this.updateCode(newCode);
    } else {
      this.resource.code = newCode;
      this.scheduleCheck();
    }
  }

  private updateCode(newCode: string) {
    const resourceModel = {...this.resource, code: newCode};
    this.update.emit(resourceModel);
  }

  public onNameBlur(newName: string) {
    this.nameHasFocus = false;

    if (this.resource.id) {
      this.updateName(newName);
    } else {
      this.resource.name = newName;
      this.scheduleCheck();
    }
  }

  private updateName(newName: string) {
    const resourceModel = {...this.resource, name: newName};
    this.update.emit(resourceModel);
  }

  private scheduleCheck() {
    setTimeout(() => {
      this.checkForCreate();
    }, 100);
  }

  private checkForCreate() {
    if (this.codeHasFocus || this.nameHasFocus || this.isPickerVisible || !this.resource.code) {
      return;
    }

    if (this.resource.icon === DEFAULT_ICON && this.resource.color === DEFAULT_COLOR) {
      this.showPicker();
      return;
    }

    this.create.emit(this.resource);
  }

  private isNewCodeValid(code: string): boolean {
    return !this.restrictedCodes.includes(code);
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

  public serviceLevelTitle(): string {
    return this.i18n(
      {
        id: 'resource.chooser.serviceLevel',
        value: '{serviceLevel, select, FREE {Free} BASIC {Business}}',
      },
      {
        serviceLevel: this.serviceLevel,
      }
    );
  }
}
