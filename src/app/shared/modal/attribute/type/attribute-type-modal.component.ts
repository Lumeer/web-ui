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
import {ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {debounceTime, map} from 'rxjs/operators';

import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {AppState} from '../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {selectLinkTypeByIdWithCollections} from '../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {
  selectCollectionPermissions,
  selectLinkTypePermissions,
} from '../../../../core/store/user-permissions/user-permissions.state';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {AttributeTypeFormComponent} from './form/attribute-type-form.component';

@Component({
  selector: 'attribute-type-modal',
  templateUrl: './attribute-type-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeModalComponent implements OnInit, OnDestroy {
  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributeId: string;

  @Input()
  public workspace: Workspace;

  @ViewChild(AttributeTypeFormComponent)
  set content(content: AttributeTypeFormComponent) {
    if (content) {
      this.constraintForm = content;
      this.initFormStatusChanges();
    }
  }

  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public attribute$: Observable<Attribute>;
  public formInvalid$ = new BehaviorSubject(true);
  public permissions$: Observable<AllowedPermissions>;
  public performingAction$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();
  public constraintForm: AttributeTypeFormComponent;

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    if (this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
      this.attribute$ = this.collection$.pipe(
        map(collection => findAttribute(collection?.attributes, this.attributeId))
      );
      this.permissions$ = this.store$.pipe(select(selectCollectionPermissions(this.collectionId)));
    } else if (this.linkTypeId) {
      this.linkType$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.linkTypeId)));
      this.attribute$ = this.linkType$.pipe(map(linkType => findAttribute(linkType?.attributes, this.attributeId)));
      this.permissions$ = this.store$.pipe(select(selectLinkTypePermissions(this.linkTypeId)));
    }
  }

  public initFormStatusChanges() {
    const form = this.constraintForm.form;
    setTimeout(() => this.formInvalid$.next(form.invalid));
    this.subscriptions.add(
      form.statusChanges.pipe(debounceTime(50)).subscribe(() => {
        this.formInvalid$.next(form.invalid);
      })
    );
  }

  public onAttributeChange(attribute: Attribute) {
    this.performingAction$.next(true);
    if (this.collectionId) {
      this.updateCollectionAttribute(this.collectionId, attribute);
    } else if (this.linkTypeId) {
      this.updateLinkTypeAttribute(this.linkTypeId, attribute);
    }
  }

  private updateCollectionAttribute(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
        attributeId: attribute.id,
        attribute,
        workspace: this.workspace,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private updateLinkTypeAttribute(linkTypeId: string, attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.UpdateAttribute({
        linkTypeId,
        attributeId: attribute.id,
        attribute,
        workspace: this.workspace,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit() {
    this.constraintForm.onSubmit();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
