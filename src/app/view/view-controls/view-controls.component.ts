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

import {Router} from '@angular/router';
import {Component, EventEmitter, Input, Output, TemplateRef} from '@angular/core';

import {SnotifyService} from 'ng-snotify';

import {PERSPECTIVES} from '../perspectives/perspective';
import {View} from '../../core/dto/view';
import {ViewService} from '../../core/rest/view.service';
import {WorkspaceService} from '../../core/workspace.service';
import {PerspectiveChoice} from '../perspectives/perspective-choice';
import {QueryConverter} from '../../shared/utils/query-converter';

@Component({
  selector: 'view-controls',
  templateUrl: './view-controls.component.html',
  styleUrls: ['./view-controls.component.scss']
})
export class ViewControlsComponent {

  @Input()
  public view: View;

  @Output()
  public save = new EventEmitter();

  constructor(private notificationService: SnotifyService,
              private router: Router,
              private workspaceService: WorkspaceService) {
  }

  public onSelectPerspective(perspectiveId: string) {
    const path = ['w', this.workspaceService.organizationCode, this.workspaceService.projectCode, 'view'];
    if (this.view.code) {
      path.push(this.view.code);
    }

    this.router.navigate(path, {
      queryParams: {
        perspective: perspectiveId
      },
      queryParamsHandling: 'merge'
    });
  }

  public onSave() {
    // TODO validation
    this.save.emit();
  }

  public onCopy() {
    this.router.navigate(['w', this.workspaceService.organizationCode, this.workspaceService.projectCode, 'view'], {
      queryParams: {
        query: QueryConverter.toString(this.view.query),
        perspective: this.view.perspective
      }
    }); // TODO transfer config somehow
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
