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

import {Component, OnInit, ChangeDetectionStrategy, Input, HostListener, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {BehaviorSubject, Observable} from 'rxjs';
import {Attribute, AttributeFormatting, Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {selectLinkTypeByIdWithCollections} from '../../../../core/store/link-types/link-types.state';
import {map} from 'rxjs/operators';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {keyboardEventCode, KeyCode} from '../../../key-code';
import {ConditionalFormattingContentComponent} from './content/conditional-formatting-content.component';

@Component({
  templateUrl: './conditional-formatting-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalFormattingModalComponent implements OnInit {
  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributeId: string;

  @Input()
  public workspace: Workspace;

  @ViewChild(ConditionalFormattingContentComponent)
  public contentComponent: ConditionalFormattingContentComponent;

  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public attribute$: Observable<Attribute>;

  public performingAction$ = new BehaviorSubject(false);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    if (this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
      this.attribute$ = this.collection$.pipe(
        map(collection => findAttribute(collection?.attributes, this.attributeId))
      );
    } else if (this.linkTypeId) {
      this.linkType$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.linkTypeId)));
      this.attribute$ = this.linkType$.pipe(map(linkType => findAttribute(linkType?.attributes, this.attributeId)));
    }
  }

  public onSubmit() {
    this.contentComponent?.onSubmit();
  }

  public onFormattingChange(formatting: AttributeFormatting, attribute: Attribute) {
    this.performingAction$.next(true);
    const newAttribute = {...attribute, formatting};

    if (this.collectionId) {
      this.updateCollectionAttribute(this.collectionId, newAttribute);
    } else if (this.linkTypeId) {
      this.updateLinkTypeAttribute(this.linkTypeId, newAttribute);
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

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
