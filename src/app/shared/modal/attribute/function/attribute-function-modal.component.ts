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
import {UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {Attribute, AttributeFunction, Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {selectCollectionById} from '../../../../core/store/collections/collections.state';
import {map, mergeMap, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {
  selectReadableCollections,
  selectLinkTypesByCollectionId,
  selectViewsByRead,
} from '../../../../core/store/common/permissions.selectors';
import {
  selectAllLinkTypes,
  selectLinkTypeByIdWithCollections,
} from '../../../../core/store/link-types/link-types.state';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {keyboardEventCode, KeyCode} from '../../../key-code';
import {DialogType} from '../../dialog-type';
import {AttributesResource} from '../../../../core/model/resource';
import {selectResourceVariablesKeysByCurrentProject} from '../../../../core/store/resource-variables/resource-variables.state';
import {
  attributeHasEditableFunction,
  attributeHasFunction,
  attributeRuleFunction,
  findAttributeRule,
} from '../../../utils/attribute.utils';
import {BlocklyRule, Rule} from '../../../../core/model/rule';
import {View} from '../../../../core/store/views/view';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {AttributeLock} from '@lumeer/data-filters';
import {selectSelectionListNamesByWorkspaceSorted} from '../../../../core/store/selection-lists/selection-lists.state';

@Component({
  selector: 'attribute-function-dialog',
  templateUrl: './attribute-function-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionModalComponent implements OnInit {
  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributeId: string;

  @Input()
  public workspace: Workspace;

  public readonly dialogType = DialogType;

  public collections$: Observable<Collection[]>;
  public collection$: Observable<Collection>;
  public attribute$: Observable<Attribute>;
  public attributeFunction$: Observable<AttributeFunction>;
  public linkTypes$: Observable<LinkType[]>;
  public linkType$: Observable<LinkType>;
  public views$: Observable<View[]>;
  public variableNames$: Observable<string[]>;
  public selectionLists$: Observable<string[]>;

  public performingAction$ = new BehaviorSubject(false);

  public form: UntypedFormGroup = new UntypedFormGroup({
    js: new UntypedFormControl(),
    xml: new UntypedFormControl(),
    editable: new UntypedFormControl(),
    display: new UntypedFormControl(),
    dryRun: new UntypedFormControl(),
    recursive: new UntypedFormControl(),
  });
  public resource: AttributesResource;

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(select(selectReadableCollections));
    this.views$ = this.store$.pipe(select(selectViewsByRead));
    this.variableNames$ = this.store$.pipe(select(selectResourceVariablesKeysByCurrentProject));
    this.selectionLists$ = this.store$.pipe(select(selectSelectionListNamesByWorkspaceSorted));

    if (this.collectionId) {
      this.collection$ = this.store$.pipe(
        select(selectCollectionById(this.collectionId)),
        tap(collection => (this.resource = collection))
      );
      this.attribute$ = this.collection$.pipe(
        map(collection => findAttribute(collection?.attributes, this.attributeId))
      );
      this.linkTypes$ = this.attribute$.pipe(
        mergeMap(attribute => {
          if (attributeHasEditableFunction(attribute)) {
            return this.store$.pipe(select(selectLinkTypesByCollectionId(this.collectionId)));
          }
          return this.store$.pipe(select(selectAllLinkTypes));
        })
      );
      this.attributeFunction$ = combineLatest([this.attribute$, this.collection$]).pipe(
        map(([attribute, collection]) => mapAttributeFunction(attribute, collection))
      );
    } else if (this.linkTypeId) {
      this.linkType$ = this.store$.pipe(
        select(selectLinkTypeByIdWithCollections(this.linkTypeId)),
        tap(linkType => (this.resource = linkType))
      );
      this.attribute$ = this.linkType$.pipe(map(linkType => findAttribute(linkType?.attributes, this.attributeId)));
      this.linkTypes$ = this.attribute$.pipe(
        mergeMap(attribute => {
          if (attributeHasEditableFunction(attribute)) {
            return this.linkType$.pipe(map(linkType => [linkType]));
          }
          return this.store$.pipe(select(selectAllLinkTypes));
        })
      );
      this.attributeFunction$ = combineLatest([this.attribute$, this.linkType$]).pipe(
        map(([attribute, linkType]) => mapAttributeFunction(attribute, linkType))
      );
    }
  }

  private onAttributeChange(attribute: Attribute) {
    const newAttribute = {
      ...attribute,
      function: {
        ...attribute.function,
        js: this.form.value.js,
        xml: this.form.value.xml,
      },
    };
    const attributeWithLock = {
      ...newAttribute,
      lock: this.checkAttributeLock(newAttribute),
    };
    if (this.collectionId) {
      this.updateCollectionAttribute(this.collectionId, attributeWithLock);
    } else if (this.linkTypeId) {
      this.updateLinkTypeAttribute(this.linkTypeId, attributeWithLock);
    }
  }

  private checkAttributeLock(attribute: Attribute): AttributeLock {
    if (attributeHasFunction(attribute)) {
      if (!attribute.lock?.exceptionGroups?.length) {
        return {locked: true, exceptionGroups: []};
      }
      return attribute.lock;
    }
    if (!attribute.lock?.exceptionGroups?.length) {
      return {locked: false, exceptionGroups: []};
    }
    return attribute.lock;
  }

  private updateCollectionAttribute(collectionId: string, attribute: Attribute) {
    this.performingAction$.next(true);
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
    this.performingAction$.next(true);

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

  public onSubmit(attribute: Attribute) {
    if (attributeHasFunction(attribute) || attribute.constraint?.allowEditFunction) {
      this.onAttributeChange(attribute);
    } else {
      this.onRuleChange(attribute);
    }
  }

  private onRuleChange(attribute: Attribute) {
    const rule = <BlocklyRule>findAttributeRule(attribute, this.resource?.rules);
    const newRule = {
      ...rule,
      configuration: {
        ...rule.configuration,
        blocklyJs: this.form.value.js,
        blocklyXml: this.form.value.xml,
        blocklyDryRun: this.form.value.dryRun,
        blocklyRecursive: this.form.value.recursive,
      },
    };

    if (this.collectionId) {
      this.updateCollectionRule(this.collectionId, newRule);
    } else if (this.linkTypeId) {
      this.updateLinkTypeRule(this.linkTypeId, newRule);
    }
  }

  private updateCollectionRule(collectionId: string, rule: Rule) {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new CollectionsAction.UpsertRule({
        collectionId,
        rule,
        workspace: this.workspace,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  private updateLinkTypeRule(linkTypeId: string, rule: Rule) {
    this.performingAction$.next(true);
    this.store$.dispatch(
      new LinkTypesAction.UpsertRule({
        linkTypeId,
        rule,
        workspace: this.workspace,
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (keyboardEventCode(event) === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}

function mapAttributeFunction(attribute: Attribute, resource: AttributesResource): AttributeFunction {
  if (!attribute || !resource) {
    return null;
  }
  return attributeHasFunction(attribute) ? attribute.function : attributeRuleFunction(attribute, resource?.rules);
}
