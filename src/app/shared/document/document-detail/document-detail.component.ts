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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../../../core/notifications/notification.service';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Observable, Subscription} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectUserById} from '../../../core/store/users/users.state';
import {filter, map, take} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {UsersAction} from '../../../core/store/users/users.action';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {DocumentUiService} from '../../../core/ui/document-ui.service';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {UiRow} from '../../../core/ui/ui-row';
import DeleteConfirm = DocumentsAction.DeleteConfirm;
import {Perspective, perspectivesMap} from '../../../view/perspectives/perspective';
import {PerspectiveUtils} from '../../utils/perspective.utils';

@Component({
  selector: 'document-detail',
  templateUrl: './document-detail.component.html',
  styleUrls: ['./document-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentDetailComponent implements OnInit, OnDestroy {

  @Input()
  public collection: CollectionModel;

  public document: DocumentModel;

  @Input()
  public hasWriteAccess = false;

  public createdBy$: Observable<string>;
  public updatedBy$: Observable<string>;

  public readonly PERSPECTIVE_TABLE2 = Perspective.Table2;

  private last: { collection: CollectionModel, document: DocumentModel };

  private subscriptions = new Subscription();

  constructor(private i18n: I18n,
              private store: Store<AppState>,
              private notificationService: NotificationService,
              private documentUiService: DocumentUiService,
              private perspective: PerspectiveUtils) {
  }

  get _document(): DocumentModel {
    return this.document;
  }

  @Input('document')
  set _document(model: DocumentModel) {
    this.document = model;

    this.renewSubscriptions();
  }

  public ngOnInit() {
    this.renewSubscriptions();
  }

  private renewSubscriptions(): void {
    this.subscriptions.unsubscribe();
    if (this.last) {
      this.documentUiService.destroy(this.last.collection, this.last.document);
    }

    if (this.collection && this.document) {
      this.last = { collection: this.collection, document: this.document };
      this.documentUiService.init(this.collection, this.document);

      this.createdBy$ = this.store.select(selectUserById(this.document.createdBy))
        .pipe(filter(user => !isNullOrUndefined(user)), map(user => user.name || user.email || 'Guest'));
      this.updatedBy$ = this.store.select(selectUserById(this.document.updatedBy))
        .pipe(filter(user => !isNullOrUndefined(user)), map(user => user.name || user.email || 'Guest'));

      this.subscriptions.add(this.store.select(selectOrganizationByWorkspace)
        .pipe(filter(org => !isNullOrUndefined(org)), take(1))
        .subscribe(org => this.store.dispatch(new UsersAction.Get({organizationId: org.id}))));
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.documentUiService.destroy(this.collection, this.document);
  }

  public addAttrRow() {
    this.documentUiService.onAddRow(this.collection, this.document);
  }

  public onRemoveRow(idx: number) {
    this.documentUiService.onRemoveRow(this.collection, this.document, idx);
  }

  public submitRowChange(idx: number, $event: [string, string]) {
    this.documentUiService.onUpdateRow(this.collection, this.document, idx, $event);
  }

  public onRemoveDocument() {
    this.store.dispatch(new DeleteConfirm({
      collectionId: this.document.collectionId,
      documentId: this.document.id,
    }));
  }

  public onToggleFavorite() {
    this.documentUiService.onToggleFavorite(this.collection, this.document);
  }

  public getRows$(): Observable<UiRow[]> {
    return this.documentUiService.getRows$(this.collection, this.document);
  }

  public getFavorite$(): Observable<boolean> {
    return this.documentUiService.getFavorite$(this.collection, this.document);
  }

  public getSummary$(): Observable<string> {
    return this.documentUiService.getSummary$(this.collection, this.document);
  }

  public getTrackBy(): (index: number, row: UiRow) => string {
    return this.documentUiService.getTrackBy(this.collection, this.document);
  }

  public goTo(perspective: string): void {
    this.perspective.switchPerspective(perspectivesMap[perspective], this.collection, this.document);
  }
}
