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
import {ChangeDetectionStrategy, Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
} from '@angular/forms';

import {Store, select} from '@ngrx/store';

import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, Observable, Subscription, combineLatest} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith, take} from 'rxjs/operators';

import {AppState} from '../../../../../core/store/app.state';
import {
  selectReadableCollections,
  selectReadableLinkTypesWithCollections,
} from '../../../../../core/store/common/permissions.selectors';
import {SelectionListsAction} from '../../../../../core/store/selection-lists/selection-lists.action';
import {selectSelectionListsByProjectSorted} from '../../../../../core/store/selection-lists/selection-lists.state';
import {minLengthValidator} from '../../../../../core/validators/custom-validators';
import {minimumValuesCountValidator} from '../../../../../core/validators/mininum-values-count-validator';
import {uniqueValuesValidator} from '../../../../../core/validators/unique-values-validator';
import {KeyCode, keyboardEventCode} from '../../../../key-code';
import {SelectConstraintOptionsFormControl} from '../../../../modal/attribute/type/form/constraint-config/select/select-constraint-form-control';
import {parseSelectOptionsFromForm} from '../../../../modal/attribute/type/form/constraint-config/select/select-constraint.utils';
import {DialogType} from '../../../../modal/dialog-type';
import {SelectionList} from '../../selection-list';
import {
  AttributeSelectionList,
  collectionAttributeCustomSelectionLists,
  linkTypeAttributeCustomSelectionLists,
} from '../attribute-selection-list';

@Component({
  selector: 'selection-list-modal',
  templateUrl: './selection-list-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionListModalComponent implements OnInit, OnDestroy {
  @Input()
  public list: SelectionList;

  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  public readonly dialogType = DialogType.Primary;

  public invalid$: Observable<boolean>;
  public attributesSelectionLists$: Observable<AttributeSelectionList[]>;

  public performingAction$ = new BehaviorSubject(false);
  public list$ = new BehaviorSubject<SelectionList>(null);

  public form: UntypedFormGroup;
  private subscriptions = new Subscription();

  constructor(
    private bsModalRef: BsModalRef,
    private store$: Store<AppState>,
    private fb: UntypedFormBuilder
  ) {}

  public ngOnInit() {
    this.createForm();

    this.list$.next(this.list);
  }

  private createForm() {
    this.form = this.fb.group({
      name: [this.list.name, minLengthValidator(1), this.uniqueName(this.list?.id)],
      displayValues: [this.list.displayValues],
      options: this.fb.array([]),
    });

    this.setOptionsValidator();

    this.invalid$ = this.form.statusChanges.pipe(
      startWith(''),
      map(() => this.form.invalid),
      distinctUntilChanged(),
      debounceTime(100)
    );
    this.subscriptions.add(this.displayValuesControl.valueChanges.subscribe(() => this.setOptionsValidator()));

    this.attributesSelectionLists$ = combineLatest([
      this.store$.pipe(select(selectReadableCollections)),
      this.store$.pipe(select(selectReadableLinkTypesWithCollections)),
    ]).pipe(
      map(([collections, linkTypes]) => [
        ...collections.reduce(
          (lists, collection) => [...lists, ...collectionAttributeCustomSelectionLists(collection)],
          []
        ),
        ...linkTypes.reduce((lists, linkType) => [...lists, ...linkTypeAttributeCustomSelectionLists(linkType)], []),
      ])
    );
  }

  private setOptionsValidator() {
    if (this.displayValuesControl.value) {
      this.optionsControl.setValidators([
        uniqueValuesValidator(SelectConstraintOptionsFormControl.Value, true),
        minimumValuesCountValidator(SelectConstraintOptionsFormControl.Value, 1),
      ]);
    } else {
      this.optionsControl.setValidators([
        uniqueValuesValidator(SelectConstraintOptionsFormControl.DisplayValue, true),
        minimumValuesCountValidator(SelectConstraintOptionsFormControl.DisplayValue, 1),
      ]);
    }
    this.optionsControl.updateValueAndValidity();
  }

  public uniqueName(excludeId?: string): AsyncValidatorFn {
    return (control: AbstractControl) =>
      this.store$.pipe(
        select(selectSelectionListsByProjectSorted(this.organizationId, this.projectId)),
        map(lists => {
          const allNames = lists
            .filter(list => list.name && (!excludeId || list.id !== excludeId))
            .map(list => list.name.trim());

          const value = control.value.trim();

          if (allNames.includes(value)) {
            return {notUnique: true};
          } else {
            return null;
          }
        }),
        take(1)
      );
  }

  public onSubmit() {
    const displayValues = this.form.controls.displayValues.value;
    const options = parseSelectOptionsFromForm(this.form.controls.options as UntypedFormArray, displayValues);
    const name = this.form.value.name.trim();
    const list = {
      ...this.list,
      ...this.form.value,
      name,
      options,
      organizationId: this.organizationId,
      projectId: this.projectId,
    };
    this.performingAction$.next(true);

    if (this.list.id) {
      this.store$.dispatch(
        new SelectionListsAction.Update({
          list,
          onSuccess: () => this.hideDialog(),
          onFailure: () => this.performingAction$.next(false),
        })
      );
    } else {
      this.store$.dispatch(
        new SelectionListsAction.Create({
          list,
          onSuccess: () => this.hideDialog(),
          onFailure: () => this.performingAction$.next(false),
        })
      );
    }
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public get displayValuesControl(): AbstractControl {
    return this.form.get('displayValues');
  }

  public get optionsControl(): AbstractControl {
    return this.form.get('options');
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onListSelected(list: AttributeSelectionList) {
    this.form.patchValue({name: list.shortName, displayValues: list.displayValues});
    this.list$.next({...list, id: null, options: [...list.options]});
  }
}
