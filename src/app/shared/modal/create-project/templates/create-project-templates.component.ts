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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Project} from '../../../../core/store/projects/project';
import {LoadingState} from '../../../../core/model/loading-state';
import {BehaviorSubject} from 'rxjs';
import {createTagsFromTemplates} from '../model/templates-util';

@Component({
  selector: 'create-project-templates',
  templateUrl: './create-project-templates.component.html',
  styleUrls: ['./create-project-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectTemplatesComponent implements OnChanges {

  @Input()
  public templates: Project[];

  @Input()
  public loadingState: LoadingState;

  @Input()
  public selectedTemplateId: string;

  public selectedTag$ = new BehaviorSubject<string>(null);
  public selectedTemplate$ = new BehaviorSubject<Project>(null);

  constructor() {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.templates || changes.loadingState) {
      this.checkSelectedItems();
    }
  }

  private checkSelectedItems() {
    if (this.selectedTag$.value || this.selectedTemplate$.value) {
      return;
    }

    const selectedTemplate = this.selectedTemplateId && this.templates?.find(template => template.id === this.selectedTemplateId);
    if (selectedTemplate) {
      this.selectedTemplate$.next(selectedTemplate);
      this.selectedTag$.next(selectedTemplate.templateMetadata?.tags?.[0]);
    } else if (this.templates?.length) {
      const tags = createTagsFromTemplates(this.templates);
      this.selectedTag$.next(tags[0]);
    }
  }

  public onSelectTagThroughSearch(tag: string) {
    this.selectedTag$.next(tag);
    this.selectedTemplate$.next(null);
  }

  public onSelectTemplateThroughSearch(template: Project) {
    this.selectedTag$.next(null);
    this.selectedTemplate$.next(template);
  }
}
