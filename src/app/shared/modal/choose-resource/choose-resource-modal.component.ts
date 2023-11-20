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

import {Component, ChangeDetectionStrategy, Input, OnInit} from '@angular/core';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {AttributesResource, AttributesResourceType} from '../../../core/model/resource';
import {selectLinkTypesByIds} from '../../../core/store/link-types/link-types.state';

@Component({
  selector: 'choose-resource-modal',
  templateUrl: './choose-resource-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChooseResourceModalComponent implements OnInit {
  @Input()
  public resourceIds: string[];

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public title: string;

  @Input()
  public callback: (resourceId: string) => void;

  @Input()
  public cancel: () => void;

  public defaultTitle: string;

  public selectedResourceId$ = new BehaviorSubject<string>(null);
  public resources$: Observable<AttributesResource[]>;

  public readonly dialogType = DialogType;

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    if (this.resourceType === AttributesResourceType.Collection) {
      this.resources$ = this.store$.pipe(select(selectCollectionsByIds(this.resourceIds)));
      this.defaultTitle = $localize`:@@collection.select:Select a Table`;
    } else if (this.resourceType === AttributesResourceType.LinkType) {
      this.resources$ = this.store$.pipe(select(selectLinkTypesByIds(this.resourceIds)));
      this.defaultTitle = $localize`:@@linkType.select:Select a Link Type`;
    }
  }

  public onSelectResource(resource: AttributesResource) {
    this.selectedResourceId$.next(resource.id);
  }

  public onClose() {
    this.cancel?.();
    this.hideDialog();
  }

  public onSubmit() {
    this.callback?.(this.selectedResourceId$.value);
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}
