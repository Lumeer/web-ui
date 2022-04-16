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

import {ChangeDetectionStrategy, Component, Input, OnInit, TemplateRef} from '@angular/core';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {BehaviorSubject, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {DialogType} from '../dialog-type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectLinkInstanceById} from '../../../core/store/link-instances/link-instances.state';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {take} from 'rxjs/operators';

@Component({
  templateUrl: './data-resource-detail-loading-modal.component.html',
  styleUrls: ['./data-resource-detail-loading-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDetailLoadingModalComponent implements OnInit {
  @Input()
  public resourceId: string;

  @Input()
  public dataResourceId: string;

  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public toolbarRef: TemplateRef<any>;

  @Input()
  public viewId: string;

  public readonly dialogType = DialogType;

  public loading$ = new BehaviorSubject(true);
  public error$ = new BehaviorSubject(false);

  public resource$: Observable<AttributesResource>;
  public dataResource$: Observable<DataResource>;

  constructor(private store$: Store<AppState>, private bsModalRef: BsModalRef) {}

  public ngOnInit() {
    if (this.resourceType === AttributesResourceType.Collection) {
      this.dataResource$ = this.store$.pipe(select(selectDocumentById(this.dataResourceId)));
      this.resource$ = this.store$.pipe(select(selectCollectionById(this.resourceId)));

      this.dataResource$.pipe(take(1)).subscribe(document => {
        if (!document) {
          this.loadDocument();
        }
      });
    } else {
      this.dataResource$ = this.store$.pipe(select(selectLinkInstanceById(this.dataResourceId)));
      this.resource$ = this.store$.pipe(select(selectLinkTypeById(this.resourceId)));

      this.dataResource$.pipe(take(1)).subscribe(linkInstance => {
        if (!linkInstance) {
          this.loadLinkInstance();
        }
      });
    }
  }

  private loadDocument() {
    this.store$.dispatch(
      new DocumentsAction.GetSingle({
        documentId: this.dataResourceId,
        collectionId: this.resourceId,
        onSuccess: () => {
          this.loading$.next(false);
        },
        onFailure: () => {
          this.loading$.next(false);
          this.error$.next(true);
        },
      })
    );
  }

  private loadLinkInstance() {
    this.store$.dispatch(
      new LinkInstancesAction.GetSingle({
        linkInstanceId: this.dataResourceId,
        linkTypeId: this.resourceId,
        onSuccess: () => {
          this.loading$.next(false);
        },
        onFailure: () => {
          this.loading$.next(false);
          this.error$.next(true);
        },
      })
    );
  }

  public onClose() {
    this.hideDialog();
  }

  private hideDialog() {
    this.bsModalRef.hide();
  }
}
