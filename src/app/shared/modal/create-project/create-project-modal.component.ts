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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';

@Component({
  selector: 'create-project',
  templateUrl: './create-project-modal.component.html',
  styleUrls: ['./create-project-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProjectModalComponent implements OnInit {
  public performingAction$ = new BehaviorSubject(false);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    // TODO
  }

  public onSubmit() {
    // TODO
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }
}
