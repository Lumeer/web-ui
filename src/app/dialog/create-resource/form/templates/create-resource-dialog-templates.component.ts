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

import {AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Template, TemplateType} from '../../../../core/model/template';
import {TemplateService} from '../../../../core/service/template.service';
import {generateId} from '../../../../shared/utils/resource.utils';

@Component({
  selector: 'create-resource-dialog-templates',
  templateUrl: './create-resource-dialog-templates.component.html',
  styleUrls: ['./create-resource-dialog-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogTemplatesComponent implements OnInit, AfterViewInit {
  @Input()
  public selectedTemplate: TemplateType;

  @Output()
  public templateSelect = new EventEmitter<TemplateType>();

  public templates: Template[];
  public readonly idPrefix = generateId();

  constructor(private templateService: TemplateService) {}

  public ngOnInit() {
    this.templates = this.templateService.getTemplates();
  }

  public onSelect(template: Template) {
    this.templateSelect.emit(template.type);
  }

  public ngAfterViewInit() {
    if (this.selectedTemplate !== TemplateType.Empty) {
      const templateElement = document.getElementById(`${this.idPrefix}${this.selectedTemplate}`);
      setTimeout(() => {
        templateElement && templateElement.scrollIntoView();
      }, 500);
    }
  }
}
