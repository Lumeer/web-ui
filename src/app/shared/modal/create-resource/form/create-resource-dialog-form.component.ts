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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';

import {ResourceType} from '../../../../core/model/resource-type';
import {safeGetRandomIcon} from '../../../picker/icons';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../../core/constants';
import * as Colors from '../../../picker/colors';
import {Resource} from '../../../../core/model/resource';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {IconColorPickerComponent} from '../../../picker/icon-color/icon-color-picker.component';

@Component({
  selector: 'create-resource-dialog-form',
  templateUrl: './create-resource-dialog-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogFormComponent implements OnInit {
  @Input()
  public parentId: string;

  @Input()
  public form: UntypedFormGroup;

  @Input()
  public resourceType: ResourceType;

  @Input()
  public usedCodes: string[];

  @Output()
  public submitResource = new EventEmitter<Organization | Project>();

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public color = DEFAULT_COLOR;
  public icon = DEFAULT_ICON;

  private readonly colors = Colors.palette;

  public ngOnInit() {
    this.color = this.colors[Math.round(Math.random() * this.colors.length)];
    this.icon = safeGetRandomIcon();
  }

  public onEnter(event: any) {
    // enter is somehow propagated to dropdown and throws error
    event.preventDefault();
    event.stopPropagation();
  }

  private createResourceObject(): Resource {
    return {
      name: this.form.get('name').value,
      code: this.form.get('code').value,
      color: this.color,
      icon: this.icon,
      description: '',
    };
  }

  public onSubmit() {
    const resource = this.createResourceObject();
    this.submitResource.emit(resource);
  }

  public togglePicker() {
    this.iconColorDropdownComponent.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.color = data.color;
    this.icon = data.icon;
  }
}
