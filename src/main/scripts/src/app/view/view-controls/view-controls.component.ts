/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, Input, TemplateRef} from '@angular/core';
import {View} from '../../core/dto/view';
import {ViewService} from '../../core/rest/view.service';
import {Router} from '@angular/router';
import {WorkspaceService} from '../../core/workspace.service';
import {PerspectiveChoice} from '../perspectives/perspective-choice';
import {Query} from '../../core/dto/query';
import {PERSPECTIVES} from '../perspectives/perspective';
import {QueryConverter} from '../../shared/utils/query-converter';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';
import {NotificationsService} from 'angular2-notifications/dist';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss']
})
export class ViewControlsComponent {

  @Input()
  public view: View;

  @Input()
  public selectedPerspective: PerspectiveChoice;

  @Input()
  public query: Query;

  public shareDialog: BsModalRef;

  constructor(private modalService: BsModalService,
              private notificationService: NotificationsService,
              private router: Router,
              private viewService: ViewService,
              private workspaceService: WorkspaceService) {
  }

  public onSelectPerspective(perspectiveId: string) {
    const path = ['w', this.workspaceService.organizationCode, this.workspaceService.projectCode, 'view'];
    if (this.view) {
      path.push(this.view.code);
    }

    this.router.navigate(path, {
      queryParams: {
        perspective: perspectiveId
      },
      queryParamsHandling: 'merge'
    });
  }

  public onSave(name: string) {
    // TODO validation
    if (this.view) {
      this.updateView(name);
    } else {
      this.createView(name);
    }
  }

  private createView(name: string) {
    const view = {
      name: name,
      perspective: this.selectedPerspective.id,
      query: this.query
    };
    this.viewService.createView(view).subscribe((code: string) => {
      this.router.navigate(['w', this.workspaceService.organizationCode, this.workspaceService.projectCode, 'view', code]);
      this.notificationService.success('Success', 'View has been created');
    });
  }

  private updateView(name: string) {
    this.view.name = name;
    this.viewService.updateView(this.view.code, this.view).subscribe(() => {
      this.notificationService.success('Success', 'View has been updated');
    });
  }

  public onCopy() {
    this.router.navigate(['w', this.workspaceService.organizationCode, this.workspaceService.projectCode, 'view'], {
      queryParams: {
        query: QueryConverter.toString(this.view.query),
        perspective: this.view.perspective
      }
    });
  }

  public showShareDialog(modal: TemplateRef<any>) {
    this.shareDialog = this.modalService.show(modal);
  }

  public onCloseShareDialog() {
    this.shareDialog.hide();
  }

  public get perspectives(): PerspectiveChoice[] {
    return Object.values(PERSPECTIVES);
  }

}
