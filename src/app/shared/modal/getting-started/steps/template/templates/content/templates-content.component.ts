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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {Project} from '../../../../../../../core/store/projects/project';

@Component({
  selector: 'templates-content',
  templateUrl: './templates-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column mw-100 h-100'},
})
export class TemplatesContentComponent {
  @Input()
  public templates: Project[];

  @Input()
  public selectedTag: string;

  @Input()
  public selectedTemplate: Project;

  @Input()
  public mobile: boolean;

  @Output()
  public selectTag = new EventEmitter<string>();

  @Output()
  public selectTemplate = new EventEmitter<Project>();

  @Output()
  public backToTemplates = new EventEmitter();
}
