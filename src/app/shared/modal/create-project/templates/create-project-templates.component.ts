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
import {animate, style, transition, trigger} from '@angular/animations';
import {Project} from '../../../../core/store/projects/project';
import {LoadingState} from '../../../../core/model/loading-state';
import {BehaviorSubject} from 'rxjs';
import {createTagsFromTemplates} from '../model/templates-util';
import {AbstractControl, FormGroup} from '@angular/forms';

@Component({
  selector: 'create-project-templates',
  templateUrl: './create-project-templates.component.html',
  styleUrls: ['./create-project-templates.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('enterLeftAnimation', [
      transition(':enter', [
        style({transform: 'translateX(100%)', opacity: 0.6}),
        animate('150ms', style({transform: 'translateX(0)', opacity: 1})),
      ]),
      transition(':leave', [
        style({transform: 'translateX(0)', opacity: 1}),
        animate('150ms', style({transform: 'translateX(100%)', opacity: 0.6})),
      ]),
    ]),
    trigger('enterRightAnimation', [
      transition(':enter', [
        style({transform: 'translateX(-100%)', opacity: 0.6}),
        animate('150ms', style({transform: 'translateX(0)', opacity: 1})),
      ]),
      transition(':leave', [
        style({transform: 'translateX(0)', opacity: 1}),
        animate('150ms', style({transform: 'translateX(-100%)', opacity: 0.6})),
      ]),
    ]),
  ],
})
export class CreateProjectTemplatesComponent implements OnInit, OnChanges {
  @Input()
  public templates: Project[];

  @Input()
  public loadingState: LoadingState;

  @Input()
  public form: FormGroup;

  @Input()
  public initialTemplateCode: string;

  public selectedTag$ = new BehaviorSubject<string>(null);
  public selectedTemplate$ = new BehaviorSubject<Project>(null);
  public mobile$ = new BehaviorSubject(false);
  public column$ = new BehaviorSubject(0);

  public ngOnInit() {
    this.detectMobileResolution();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.templates || changes.loadingState) {
      this.checkSelectedItems();
    }
  }

  private get templateSelectedControl(): AbstractControl {
    return this.form.controls.templateSelected;
  }

  private checkSelectedItems() {
    if (this.selectedTag$.value || this.selectedTemplate$.value) {
      return;
    }

    const selectedTemplate =
      this.initialTemplateCode && this.templates?.find(template => template.code === this.initialTemplateCode);
    if (selectedTemplate) {
      this.selectedTemplate$.next(selectedTemplate);
      this.selectedTag$.next(selectedTemplate.templateMetadata?.tags?.[0]);
      setTimeout(() => this.templateSelectedControl.patchValue(true));
    } else if (this.templates?.length) {
      const tags = createTagsFromTemplates(this.templates);
      this.selectedTag$.next(tags[0]);
    }
  }

  public onSelectTagThroughSearch(tag: string) {
    this.selectedTag$.next(tag);
    this.selectedTemplate$.next(null);
    this.column$.next(1);
    this.templateSelectedControl.patchValue(false);
  }

  public onSelectTemplateThroughSearch(template: Project) {
    this.selectedTag$.next(null);
    this.selectedTemplate$.next(template);
    this.column$.next(1);
    this.templateSelectedControl.patchValue(true);
  }

  public onSelectTemplate(template: Project) {
    this.selectedTemplate$.next(template);
    this.column$.next(1);
    this.templateSelectedControl.patchValue(true);
  }

  public onSelectTag(tag: string) {
    this.selectedTag$.next(tag);
    this.selectedTemplate$.next(null);
    this.column$.next(1);
    this.templateSelectedControl.patchValue(false);
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
