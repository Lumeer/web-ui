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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, HostListener, OnInit} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {createTagsFromTemplates} from './tags/templates-tags.component';
import {emptyEnterAnimation, enterLeftAnimation, enterRightAnimation} from '../../../../../animations';
import {Project} from '../../../../../../core/store/projects/project';
import {LoadingState} from '../../../../../../core/model/loading-state';
import {GettingStartedService} from '../../../getting-started.service';

@Component({
  selector: 'project-templates',
  templateUrl: './project-templates.component.html',
  styleUrls: ['./project-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [enterLeftAnimation, enterRightAnimation, emptyEnterAnimation],
})
export class ProjectTemplatesComponent implements OnInit, OnChanges {
  @Input()
  public templates: Project[];

  @Input()
  public loadingState: LoadingState;

  @Input()
  public initialTemplateCode: string;

  public mobile$ = new BehaviorSubject(false);
  public column$ = new BehaviorSubject(0);

  constructor(public service: GettingStartedService) {}

  public ngOnInit() {
    this.detectMobileResolution();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.templates || changes.loadingState) {
      this.checkSelectedItems();
    }
  }

  private checkSelectedItems() {
    if (this.service.selectedTag || this.service.selectedTemplate) {
      return;
    }

    const selectedTemplate =
      this.initialTemplateCode && this.templates?.find(template => template.code === this.initialTemplateCode);
    if (selectedTemplate) {
      setTimeout(() => (this.service.selectedTemplate = selectedTemplate));
      this.service.selectedTag = selectedTemplate.templateMetadata?.tags?.[0];
    } else if (this.templates?.length) {
      const tags = createTagsFromTemplates(this.templates);
      this.service.selectedTag = tags[0];
    }
  }

  public onSelectTagThroughSearch(tag: string) {
    this.service.selectedTag = tag;
    this.service.selectedTemplate = null;
    this.column$.next(1);
  }

  public onSelectTemplateThroughSearch(template: Project) {
    this.service.selectedTag = null;
    this.service.selectedTemplate = template;
    this.column$.next(1);
  }

  public onSelectTemplate(template: Project) {
    this.service.selectedTemplate = template;
    this.column$.next(1);
  }

  public onSelectTag(tag: string) {
    this.service.selectedTag = tag;
    this.service.selectedTemplate = null;
    this.column$.next(1);
  }

  public backToTemplates() {
    this.column$.next(0);
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.detectMobileResolution();
  }

  private detectMobileResolution() {
    this.mobile$.next(window.matchMedia('(max-width: 767.98px)').matches);
  }
}
