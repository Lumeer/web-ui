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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {AppState} from '../../core/store/app.state';
import {Store} from '@ngrx/store';
import {ActivatedRoute} from '@angular/router';
import {filter, map} from 'rxjs/operators';
import {selectCollectionByWorkspace} from '../../core/store/collections/collections.state';
import {Subscription} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {DialogService} from '../dialog.service';

@Component({
  selector: 'blockly-editor',
  templateUrl: './blockly-editor.component.html',
  styleUrls: ['./blockly-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocklyEditorComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  private collection: Collection;
  private ruleName: string;

  constructor(private store$: Store<AppState>, private route: ActivatedRoute, private dialogService: DialogService) {}

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('ruleName')),
        filter(ruleName => !!ruleName)
      )
      .subscribe(ruleName => (this.ruleName = ruleName));

    this.subscriptions.add(
      this.store$
        .select(selectCollectionByWorkspace)
        .pipe(filter(collection => !!collection))
        .subscribe(collection => (this.collection = collection))
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public onSubmit() {
    console.log('onSubmit');

    if (this.dialogService.callback) {
      console.log('callback má');
      this.dialogService.callback('javascript', 'xmlko');
    }
    this.dialogService.closeDialog();
  }
}
