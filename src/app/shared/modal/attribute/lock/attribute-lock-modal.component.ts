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
import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit, ViewChild} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subject, combineLatest} from 'rxjs';
import {map} from 'rxjs/operators';

import {AttributeLock} from '@lumeer/data-filters';

import {AppState} from '../../../../core/store/app.state';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {selectLinkTypeByIdWithCollections} from '../../../../core/store/link-types/link-types.state';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {KeyCode, keyboardEventCode} from '../../../key-code';
import {AttributeLockContentComponent} from './content/attribute-lock-content.component';

@Component({
  selector: 'attribute-lock-modal',
  templateUrl: './attribute-lock-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeLockModalComponent implements OnInit {
  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributeId: string;

  @Input()
  public workspace: Workspace;

  @Input()
  public overrideLock: AttributeLock;

  @Input()
  public handleSubmit: boolean;

  @ViewChild(AttributeLockContentComponent)
  public contentComponent: AttributeLockContentComponent;

  public collection$: Observable<Collection>;
  public linkType$: Observable<LinkType>;
  public attribute$: Observable<Attribute>;

  public onSubmit$ = new Subject<AttributeLock>();
  public performingAction$ = new BehaviorSubject(false);
  public overrideLock$ = new BehaviorSubject<AttributeLock>(null);

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.overrideLock$.next(this.overrideLock);
    if (this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
      this.attribute$ = combineLatest([this.collection$, this.overrideLock$]).pipe(
        map(([collection, overrideLock]) =>
          checkOverrideLock(findAttribute(collection?.attributes, this.attributeId), overrideLock)
        )
      );
    } else if (this.linkTypeId) {
      this.linkType$ = this.store$.pipe(select(selectLinkTypeByIdWithCollections(this.linkTypeId)));
      this.attribute$ = combineLatest([this.linkType$, this.overrideLock$]).pipe(
        map(([linkType, overrideLock]) =>
          checkOverrideLock(findAttribute(linkType?.attributes, this.attributeId), overrideLock)
        )
      );
    }
  }

  public onSubmit() {
    this.contentComponent?.onSubmit();
  }

  public onLockChange(lock: AttributeLock, attribute: Attribute) {
    if (this.handleSubmit) {
      this.onSubmit$.next(lock);
      this.hideDialog();
    } else {
      this.performingAction$.next(true);
      const newAttribute = {...attribute, lock};
      if (this.collectionId) {
        this.updateCollectionAttribute(this.collectionId, newAttribute);
      } else if (this.linkTypeId) {
        this.updateLinkTypeAttribute(this.linkTypeId, newAttribute);
      }
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

function checkOverrideLock(attribute: Attribute, lock: AttributeLock): Attribute {
  return {...attribute, lock: lock || attribute.lock};
}
