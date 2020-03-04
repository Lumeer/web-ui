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

import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  Input,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  HostListener
} from '@angular/core';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {KeyCode} from '../../key-code';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {Query} from '../../../core/store/navigation/query/query';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {BsModalRef} from 'ngx-bootstrap';

@Component({
  selector: 'data-resource-detail',
  templateUrl: './data-resource-detail.component.html',
  styleUrls: ['./data-resource-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataResourceDetailComponent implements OnInit, OnChanges {

  @Input()
  public resource: AttributesResource;

  @Input()
  public dataResource: DataResource;

  @Input()
  public toolbarRef: TemplateRef<any>;

  public resourceType: AttributesResourceType;

  public onCancel$ = new Subject();
  public performingAction$ = new BehaviorSubject(false);

  public query$: Observable<Query>;

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.resourceType = getAttributesResourceType(this.resource);
  }

  ngOnInit() {
  }

  public onClose() {
    this.onCancel$.next();
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.onClose();
    }
  }

}
