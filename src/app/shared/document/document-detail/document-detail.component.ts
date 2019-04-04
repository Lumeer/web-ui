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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../../core/notifications/notification.service';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectUserById} from '../../../core/store/users/users.state';
import {filter, map} from 'rxjs/operators';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {UiRow} from '../../../core/ui/ui-row';
import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';
import {PerspectiveService} from '../../../core/service/perspective.service';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {convertQueryModelToString} from '../../../core/store/navigation/query.converter';
import {Query} from '../../../core/store/navigation/query';
import {isSingleCollectionQuery} from '../../../core/store/navigation/query.util';
import {DialogService} from '../../../dialog/dialog.service';
import {DocumentUi} from '../../../core/ui/document-ui';
import DeleteConfirm = DocumentsAction.DeleteConfirm;

@Component({
  selector: 'document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDetailComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  public state: DocumentUi;

  public createdBy$: Observable<string>;
  public updatedBy$: Observable<string>;

  private query: Query;
  private subscriptions = new Subscription();

  constructor(
    private i18n: I18n,
    private store$: Store<AppState>,
    private notificationService: NotificationService,
    private perspective: PerspectiveService,
    private dialogService: DialogService
  ) {}

  public ngOnInit() {
    this.subscribeQuery();
  }

  private subscribeQuery() {
    this.subscriptions.add(this.store$.pipe(select(selectQuery)).subscribe(query => (this.query = query)));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
      this.renewSubscriptions();
    }
  }

  private renewSubscriptions(): void {
    if (this.state) {
      this.state.destroy();
    }

    if (this.collection && this.document) {
      this.state = new DocumentUi(this.collection, this.document, this.store$, this.i18n, this.notificationService);

      this.createdBy$ = this.store$.pipe(
        select(selectUserById(this.document.createdBy)),
        filter(user => !!user),
        map(user => user.name || user.email || 'Guest')
      );
      this.updatedBy$ = this.store$.pipe(
        select(selectUserById(this.document.updatedBy)),
        filter(user => !!user),
        map(user => user.name || user.email || 'Guest')
      );
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.state.destroy();
  }

  public addAttrRow() {
    this.state.onAddRow();
  }

  public onRemoveRow(idx: number) {
    this.state.onRemoveRow(idx);
  }

  public submitRowChange(idx: number, $event: [string, string]) {
    this.state.onUpdateRow(idx, $event);
  }

  public onRemoveDocument() {
    this.store$.dispatch(
      new DeleteConfirm({
        collectionId: this.document.collectionId,
        documentId: this.document.id,
      })
    );
  }

  public onToggleFavorite() {
    this.state.onToggleFavorite();
  }

  private getRows$(): Observable<UiRow[]> {
    return this.state.rows$;
  }

  public getTrackBy(index: number, row: UiRow): string {
    return row.correlationId || row.id;
  }

  public goToTablePerspective(): void {
    let collectionQuery: string = null;
    if (!isSingleCollectionQuery(this.query)) {
      collectionQuery = convertQueryModelToString({stems: [{collectionId: this.collection.id}]});
    }
    this.perspective.switchPerspective(
      perspectivesMap[Perspective.Table],
      this.collection,
      this.document,
      collectionQuery
    );
  }

  public fireConstraintConfig(id: string) {
    this.dialogService.openCollectionAttributeConfigDialog(this.collection.id, id);
  }

  public fireFunctionConfig(id: string) {
    this.dialogService.openCollectionAttributeFunction(this.collection.id, id);
  }
}
