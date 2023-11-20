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
import {ChangeDetectionStrategy, Component, HostListener, Input, OnInit} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, combineLatest} from 'rxjs';
import {map, startWith, take, tap} from 'rxjs/operators';

import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {selectLinkTypesByCollectionIds} from '../../../core/store/common/permissions.selectors';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../core/store/link-types/link.type';
import {Workspace} from '../../../core/store/navigation/workspace';
import {minLengthValidator} from '../../../core/validators/custom-validators';
import {KeyCode, keyboardEventCode} from '../../key-code';
import {DialogType} from '../dialog-type';

@Component({
  selector: 'create-link-modal',
  templateUrl: './create-link-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLinkModalComponent implements OnInit {
  @Input()
  public collectionIds: string[];

  @Input()
  public workspace: Workspace;

  @Input()
  public callback: (linkType: LinkType) => void;

  public readonly dialogType = DialogType;

  public form: UntypedFormGroup;
  public linkTypeFormGroup: UntypedFormGroup;

  public collections$: Observable<Collection[]>;
  public formInvalid$: Observable<boolean>;
  public performingAction$ = new BehaviorSubject(false);

  private collections: Collection[];

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: UntypedFormBuilder
  ) {}

  public get linkNameControl(): AbstractControl {
    return this.linkTypeFormGroup.get('linkName');
  }

  public ngOnInit() {
    this.createForm();
    this.formInvalid$ = this.form.valueChanges.pipe(
      map(() => this.form.invalid),
      startWith(false)
    );
    this.initData();
  }

  private initData() {
    this.collections$ = this.store$.pipe(
      select(selectCollectionsByIds(this.collectionIds)),
      tap(collections => (this.collections = collections))
    );

    combineLatest([this.collections$, this.store$.pipe(select(selectLinkTypesByCollectionIds(this.collectionIds)))])
      .pipe(take(1))
      .subscribe(([collections, linkTypes]) => this.initLinkTypeName(collections, linkTypes));
  }

  private initLinkTypeName(collections: Collection[], existingLinkTypes: LinkType[]) {
    const existingNames = new Set(existingLinkTypes.map(linkType => linkType.name));
    const basicName = (collections || []).map(collection => collection.name).join(' ');

    let currentName = basicName;
    let index = 2;
    while (existingNames.has(currentName)) {
      currentName = `${basicName} ${index}`;
      index++;
    }

    this.linkNameControl.setValue(currentName);
  }

  private createForm() {
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new UntypedFormGroup({
      linkType: this.linkTypeFormGroup,
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [minLengthValidator(3)];
    return this.fb.group({
      linkName: ['', validators, this.uniqueName()],
    });
  }

  public uniqueName(): AsyncValidatorFn {
    return (control: AbstractControl) =>
      this.store$.pipe(
        select(selectLinkTypesByCollectionIds(this.collectionIds)),
        map(linkTypes => new Set(linkTypes.map(linkType => linkType.name))),
        map(linkTypeNames => {
          const value = control.value.trim();
          if (linkTypeNames.has(value)) {
            return {notUnique: true};
          } else {
            return null;
          }
        }),
        take(1)
      );
  }

  public onSubmit() {
    if (this.collections?.length === 2) {
      this.performingAction$.next(true);
      this.store$.dispatch(this.createLinkTypeAction());
    }
  }

  private createLinkTypeAction(): LinkTypesAction.Create {
    const linkType: LinkType = {
      name: this.linkNameControl.value.trim(),
      collectionIds: [this.collections[0].id, this.collections[1].id],
    };
    return new LinkTypesAction.Create({
      linkType,
      workspace: this.workspace,
      onSuccess: createdLinkType => this.onSuccess(createdLinkType),
      onFailure: () => this.performingAction$.next(false),
    });
  }

  private onSuccess(linkType: LinkType) {
    this.hideDialog();
    this.callback && this.callback(linkType);
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
