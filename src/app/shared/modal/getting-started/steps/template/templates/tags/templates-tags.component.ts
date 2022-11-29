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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {Project} from '../../../../../../../core/store/projects/project';
import {uniqueValues} from '../../../../../../utils/array.utils';

@Component({
  selector: 'templates-tags',
  templateUrl: './templates-tags.component.html',
  styleUrls: ['./templates-tags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column'},
})
export class TemplatesTagsComponent implements OnChanges {
  @Input()
  public templates: Project[];

  @Input()
  public selectedTag: string;

  @Input()
  public selectedTemplate: Project;

  @Output()
  public selectTag = new EventEmitter<string>();

  @Output()
  public selectTemplate = new EventEmitter<Project>();

  public search: string;
  public tags: string[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.templates) {
      this.createTags();
    }
  }

  private createTags() {
    this.tags = createTagsFromTemplates(this.templates);
  }
}

export function createTagsFromTemplates(templates: Project[]): string[] {
  const tags = templates?.reduce((arr, template) => {
    arr.push(...(template.templateMetadata?.tags || []).filter(tag => !!tag));
    return arr;
  }, []);
  return uniqueValues(tags.sort((a, b) => a.localeCompare(b)));
}
