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

import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Workspace} from '../../core/store/navigation/workspace.model';
import {ViewModel} from '../../core/store/views/view.model';

@Component({
  selector: 'overwrite-view-dialog',
  templateUrl: './overwrite-view-dialog.component.html',
  styleUrls: ['./overwrite-view-dialog.component.scss']
})
export class OverwriteViewDialogComponent implements OnChanges {

  @Input()
  public existingView: ViewModel;

  @Input()
  public newView: ViewModel;

  @Input()
  public workspace: Workspace;

  @Output()
  public save = new EventEmitter<ViewModel>();

  public viewPath: any[] = [];

  public ngOnChanges(changes: SimpleChanges): void {
    if ((changes.hasOwnProperty('workspace') || changes.hasOwnProperty('existingView')) && this.workspace && this.existingView) {
      this.viewPath = ['/w', this.workspace.organizationCode, this.workspace.projectCode, 'view', {vc: this.existingView.code}];
    }
  }

  public onSave() {
    const view = {...this.newView, code: this.existingView.code};
    this.save.emit(view);
  }

}
