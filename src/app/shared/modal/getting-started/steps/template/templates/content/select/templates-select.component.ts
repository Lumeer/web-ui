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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {removeAccentFromString} from '@lumeer/data-filters';
import {Project} from '../../../../../../../../core/store/projects/project';

@Component({
  selector: 'templates-select',
  templateUrl: './templates-select.component.html',
  styleUrls: ['./templates-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesSelectComponent implements OnChanges {
  @Input()
  public templates: Project[];

  @Input()
  public selectedTag: string;

  @Input()
  public selectedTemplate: Project;

  @Output()
  public selectTemplate = new EventEmitter<Project>();

  public tagImageUrl: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.selectedTag) {
      this.tagImageUrl = this.createTagImageUrl();
    }
  }

  private createTagImageUrl(): string {
    const tagWithoutAccent = removeAccentFromString(this.selectedTag).replace(/ /g, '_');
    return `https://www.lumeer.io/wp-content/uploads/lumeer-projects/${tagWithoutAccent}.jpg`;
  }
}
