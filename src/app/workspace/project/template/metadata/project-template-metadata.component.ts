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

import {Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy} from '@angular/core';
import {Project} from '../../../../core/store/projects/project';
import {View} from '../../../../core/store/views/view';
import {AbstractControl, FormBuilder, FormGroup} from '@angular/forms';
import {QueryData} from '../../../../shared/top-panel/search-box/util/query-data';
import {Subscription} from 'rxjs';
import {UpdateProjectService} from '../update-project.service';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {BsDatepickerConfig} from 'ngx-bootstrap/datepicker';

@Component({
  selector: 'project-template-metadata',
  templateUrl: './project-template-metadata.component.html',
  styleUrls: ['./project-template-metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UpdateProjectService],
})
export class ProjectTemplateMetadataComponent implements OnInit, OnDestroy {
  @Input()
  public project: Project;

  @Input()
  public views: View[];

  @Input()
  public queryData: QueryData;

  @Input()
  public workspace: Workspace;

  public readonly datePickerConfig: Partial<BsDatepickerConfig> = {
    containerClass: 'theme-default',
    customTodayClass: 'date-time-today',
    adaptivePosition: true,
  };

  public formGroup: FormGroup;

  private subscriptions = new Subscription();

  constructor(private fb: FormBuilder, private updateProjectService: UpdateProjectService) {}

  public get isPublicControl(): AbstractControl {
    return this.formGroup.controls.isPublic;
  }

  public get metadataFormGroup(): FormGroup {
    return <FormGroup>this.formGroup.controls.metadata;
  }

  public get defaultViewControl(): AbstractControl {
    return this.metadataFormGroup.controls.defaultView;
  }

  public ngOnInit() {
    this.createForm();
    this.subscribeValueChanges();

    this.updateProjectService.setWorkspace(this.workspace);
  }

  private createForm() {
    this.formGroup = this.fb.group({
      isPublic: this.project?.isPublic,
      metadata: this.fb.group(
        {
          imageUrl: this.project?.templateMetadata?.imageUrl,
          allowedDomains: this.project?.templateMetadata?.allowedDomains || '*',
          defaultView: this.project?.templateMetadata?.defaultView,
          relativeDate: this.project?.templateMetadata?.relativeDate,
          editable: this.fb.control(this.project?.templateMetadata?.editable, {updateOn: 'change'}),
          showTopPanel: this.fb.control(this.project?.templateMetadata?.showTopPanel, {updateOn: 'change'}),
          tags: this.fb.array(this.project?.templateMetadata?.tags || []),
        },
        {updateOn: 'blur'}
      ),
    });
  }

  private subscribeValueChanges() {
    this.subscriptions.add(
      this.isPublicControl.valueChanges.subscribe(isPublic =>
        this.updateProject({
          ...this.project,
          isPublic,
          templateMetadata: this.metadataFormGroup.value,
        })
      )
    );
    this.subscriptions.add(
      this.metadataFormGroup.valueChanges.subscribe(templateMetadata =>
        this.updateProject({
          ...this.project,
          templateMetadata,
          isPublic: this.isPublicControl.value,
        })
      )
    );
  }

  private updateProject(project: Project) {
    this.updateProjectService.set(project.id, project);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.updateProjectService.onDestroy();
  }

  public onViewSelected(viewId: string) {
    this.defaultViewControl.patchValue(viewId);
  }
}
