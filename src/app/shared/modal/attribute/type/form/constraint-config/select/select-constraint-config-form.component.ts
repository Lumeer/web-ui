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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {SelectConstraintFormControl, SelectConstraintOptionsFormControl} from './select-constraint-form-control';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {uniqueValuesValidator} from '../../../../../../../core/validators/unique-values-validator';
import {minimumValuesCountValidator} from '../../../../../../../core/validators/mininum-values-count-validator';
import {AttributesResource, AttributesResourceType} from '../../../../../../../core/model/resource';
import {Attribute} from '../../../../../../../core/store/collections/collection';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {getAttributesResourceType} from '../../../../../../utils/resource.utils';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../../../../core/store/app.state';
import {selectConstraintData} from '../../../../../../../core/store/constraint-data/constraint-data.state';
import {createSuggestionDataValues} from '../../../../../../utils/data-resource.utils';
import {map, tap} from 'rxjs/operators';
import {DataValue, SelectConstraintConfig, SelectConstraintOption} from '@lumeer/data-filters';
import {
  selectDocumentsByCollectionAndReadPermission,
  selectLinksByLinkTypeAndReadPermission,
} from '../../../../../../../core/store/common/permissions.selectors';
import {selectSelectionListsByWorkspace} from '../../../../../../../core/store/selection-lists/selection-lists.state';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {SelectionList} from '../../../../../../lists/selection/selection-list';
import {selectProjectPermissions} from '../../../../../../../core/store/user-permissions/user-permissions.state';
import {selectWorkspace} from '../../../../../../../core/store/navigation/navigation.state';

@Component({
  selector: 'select-constraint-config-form',
  templateUrl: './select-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectConstraintConfigFormComponent implements OnInit, OnChanges {
  @Input()
  public config: SelectConstraintConfig;

  @Input()
  public form: FormGroup;

  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  public readonly formControlName = SelectConstraintFormControl;

  public overrideOptions$ = new BehaviorSubject<SelectConstraintOption[]>(null);

  public dataValues$: Observable<DataValue[]>;
  public selectionListsItems$: Observable<SelectItemModel[]>;
  public canCreateSelectionLists$: Observable<boolean>;
  public selectionListsLink$: Observable<string[]>;

  private selectionLists: SelectionList[];

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    const selectionLists$ = this.store$.pipe(select(selectSelectionListsByWorkspace));
    this.selectionListsItems$ = selectionLists$.pipe(
      tap(lists => (this.selectionLists = lists)),
      map(lists => {
        return [
          {id: undefined, classList: 'fst-italic', value: $localize`:@@constraint.select.lists.custom:Custom`},
          ...lists.map(list => ({id: list.id, value: list.name})),
        ];
      }),
      tap(lists => this.checkValidSelectedSelection(lists))
    );
    this.canCreateSelectionLists$ = this.store$.pipe(
      select(selectProjectPermissions),
      map(permissions => permissions?.roles?.TechConfig)
    );
    this.selectionListsLink$ = this.store$.pipe(
      select(selectWorkspace),
      map(workspace => ['/o', workspace?.organizationCode, 'p', workspace?.projectCode, 'selection'])
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
    if (changes.attribute || changes.resource) {
      this.dataValues$ = this.bindDataValues$();
    }
  }

  private bindDataValues$(): Observable<DataValue[]> {
    if (this.resource) {
      if (getAttributesResourceType(this.resource) === AttributesResourceType.Collection) {
        return combineLatest([
          this.store$.pipe(select(selectConstraintData)),
          this.store$.pipe(select(selectDocumentsByCollectionAndReadPermission(this.resource.id))),
        ]).pipe(
          map(([constraintData, documents]) =>
            createSuggestionDataValues(documents, this.attribute.id, this.attribute.constraint, constraintData)
          )
        );
      } else if (getAttributesResourceType(this.resource) === AttributesResourceType.LinkType) {
        return combineLatest([
          this.store$.pipe(select(selectConstraintData)),
          this.store$.pipe(select(selectLinksByLinkTypeAndReadPermission(this.resource.id))),
        ]).pipe(
          map(([constraintData, linkInstances]) =>
            createSuggestionDataValues(linkInstances, this.attribute.id, this.attribute.constraint, constraintData)
          )
        );
      }
    }
    return of([]);
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.addFormControls();
    this.addOptionsFormArray();
  }

  private addFormControls() {
    const selectionId = this.config?.selectionListId;
    this.form.addControl(SelectConstraintFormControl.Multi, new FormControl(this.config?.multi));
    this.form.addControl(
      SelectConstraintFormControl.DisplayValues,
      new FormControl({value: this.config?.displayValues, disabled: !!selectionId})
    );
    this.form.addControl(SelectConstraintFormControl.SelectionList, new FormControl(selectionId));
  }

  private addOptionsFormArray() {
    this.form.addControl(
      SelectConstraintFormControl.Options,
      new FormArray(
        [],
        [
          uniqueValuesValidator(SelectConstraintOptionsFormControl.Value, true),
          minimumValuesCountValidator(SelectConstraintOptionsFormControl.Value, 1),
        ]
      )
    );
    if (this.config?.selectionListId) {
      setTimeout(() => this.optionsControl.disable());
    }
  }

  private checkValidSelectedSelection(lists: SelectItemModel[]) {
    if (this.selectionListControl.value) {
      const listExists = lists.some(list => list.id === this.selectionListControl.value);
      if (!listExists) {
        this.resetSelectionListControlToCustom();
      }
    }
  }

  public get selectionListControl(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.SelectionList);
  }

  public get displayValuesControl(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.DisplayValues);
  }

  public get optionsControl(): AbstractControl {
    return this.form.get(SelectConstraintFormControl.Options);
  }

  public onSelectionListSelected(selectionListId: string) {
    this.selectionListControl.setValue(selectionListId);
    if (selectionListId) {
      const selectionList = this.selectionLists.find(list => list.id === selectionListId);
      this.displayValuesControl.setValue(selectionList.displayValues);
      this.displayValuesControl.disable();
      setTimeout(() => this.optionsControl.disable());
      this.overrideOptions$.next([...selectionList.options]);
    } else {
      this.displayValuesControl.enable();
      this.optionsControl.enable();
    }
  }

  public onCopy() {
    const selectionList = this.selectionLists.find(list => list.id === this.selectionListControl.value);
    if (selectionList) {
      this.resetSelectionListControlToCustom();
    }
  }

  private resetSelectionListControlToCustom() {
    this.selectionListControl.setValue(undefined); // custom list
    this.displayValuesControl.enable();
    setTimeout(() => this.optionsControl.enable());
  }
}
