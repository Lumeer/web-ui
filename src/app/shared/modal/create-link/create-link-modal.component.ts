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

import {Component, OnInit, ChangeDetectionStrategy, Input, HostListener} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Collection} from '../../../core/store/collections/collection';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {LinkType} from '../../../core/store/link-types/link.type';
import {BehaviorSubject, Observable} from 'rxjs';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap';
import {KeyCode} from '../../key-code';
import {map, startWith} from 'rxjs/operators';
import {DialogType} from '../dialog-type';

@Component({
  templateUrl: './create-link-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLinkModalComponent implements OnInit {
  @Input()
  public collections: Collection[];

  @Input()
  public callback: (linkType: LinkType) => void;

  public readonly dialogType = DialogType;

  public form: FormGroup;
  public linkTypeFormGroup: FormGroup;

  public formInvalid$: Observable<boolean>;
  public performingAction$ = new BehaviorSubject(false);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>, private fb: FormBuilder) {}

  public ngOnInit() {
    this.createForm();

    this.formInvalid$ = this.form.valueChanges.pipe(
      map(() => this.form.invalid),
      startWith(false)
    );
  }

  private createForm() {
    this.linkTypeFormGroup = this.createLinkTypeFormGroup();

    this.form = new FormGroup({
      linkType: this.linkTypeFormGroup,
    });
  }

  private createLinkTypeFormGroup() {
    const validators = [Validators.required, Validators.minLength(3)];
    return this.fb.group({
      linkName: [(this.collections || []).map(coll => coll.name).join(' '), validators],
    });
  }

  public get linkNameInput(): AbstractControl {
    return this.linkTypeFormGroup.get('linkName');
  }

  public onSubmit() {
    this.performingAction$.next(true);
    this.store$.dispatch(this.createLinkTypeAction());
  }

  private createLinkTypeAction(): LinkTypesAction.Create {
    const linkType: LinkType = {
      name: this.linkNameInput.value,
      collectionIds: [this.collections[0].id, this.collections[1].id],
    };
    return new LinkTypesAction.Create({
      linkType,
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
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
