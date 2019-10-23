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
import {BehaviorSubject, Observable} from 'rxjs';
import {findAttribute} from '../../../core/store/collections/collection.util';
import {BLOCKLY_VALUE_TOOLBOX} from '../../blockly/blockly-editor/blockly-editor-toolbox';
import {MasterBlockType} from '../../blockly/blockly-editor/blockly-editor.component';
import {RuleVariable} from '../../../collection/settings/tab/rules/rule-variable-type';
import {Attribute, Collection} from '../../../core/store/collections/collection';
import {LinkType} from '../../../core/store/link-types/link.type';
import {BlocklyDebugDisplay} from '../../blockly/blockly-debugger/blockly-debugger.component';
import {select, Store} from '@ngrx/store';
import {BsModalRef} from 'ngx-bootstrap';
import {
  selectAllCollections,
  selectCollectionById,
  selectCollectionsByLinkType,
} from '../../../core/store/collections/collections.state';
import {first, map} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {selectLinkTypeById} from '../../../core/store/link-types/link-types.state';
import {LinkTypesAction} from '../../../core/store/link-types/link-types.action';
import {CollectionsAction} from '../../../core/store/collections/collections.action';
import {KeyCode} from '../../key-code';

@Component({
  selector: 'attribute-function-dialog',
  templateUrl: './attribute-function-modal.component.html',
  styleUrls: ['./attribute-function-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionModalComponent implements OnInit {
  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public attributeId: string;

  public valueToolbox = BLOCKLY_VALUE_TOOLBOX;
  public masterValueType = MasterBlockType.Value;
  public masterLinkType = MasterBlockType.Link;
  public variables: RuleVariable[];

  public collections$: Observable<Collection[]>;
  public collection$: Observable<Collection>;
  public attribute$: Observable<Attribute>;
  public linkTypes$: Observable<LinkType[]>;
  public linkType$: Observable<LinkType>;
  public linkTypeCollections$: Observable<Collection[]>;

  public performingAction$ = new BehaviorSubject(false);

  public displayDebug: BlocklyDebugDisplay;
  public debugButtons: BlocklyDebugDisplay[] = [BlocklyDebugDisplay.DisplayJs, BlocklyDebugDisplay.DisplayError];

  public js: string = '';
  private xml: string = '';
  public editable$ = new BehaviorSubject<boolean>(undefined);

  constructor(private bsModalRef: BsModalRef, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.select(selectAllCollections);

    if (this.collectionId) {
      this.collection$ = this.store$.pipe(select(selectCollectionById(this.collectionId)));
      this.attribute$ = this.collection$.pipe(
        map(collection => findAttribute(collection && collection.attributes, this.attributeId))
      );
      this.linkTypes$ = this.store$.pipe(select(selectLinkTypesByCollectionId(this.collectionId)));
      this.variables = [{name: 'thisDocument', collectionId: this.collectionId} as RuleVariable];
    } else if (this.linkTypeId) {
      this.linkType$ = this.store$.pipe(select(selectLinkTypeById(this.linkTypeId)));
      this.linkTypeCollections$ = this.store$.pipe(select(selectCollectionsByLinkType(this.linkTypeId)));
      this.attribute$ = this.linkType$.pipe(
        map(linkType => findAttribute(linkType && linkType.attributes, this.attributeId))
      );
      this.linkTypes$ = this.linkType$.pipe(map(linkType => [linkType]));
      this.variables = [{name: 'thisLink', linkTypeId: this.linkTypeId} as RuleVariable];
    }

    this.attribute$
      .pipe(first())
      .subscribe(attribute => this.editable$.next(attribute.function ? attribute.function.editable : false));
  }

  public onAttributeChange(attribute: Attribute) {
    if (this.collectionId) {
      this.updateCollectionAttribute(this.collectionId, attribute);
    }
    if (this.linkTypeId) {
      this.updateLinkTypeAttribute(this.linkTypeId, attribute);
    }
  }

  public updateCollectionAttribute(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
        attributeId: attribute.id,
        attribute,
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
        onSuccess: () => this.hideDialog(),
        onFailure: () => this.performingAction$.next(false),
      })
    );
  }

  public hideDialog() {
    this.bsModalRef.hide();
  }

  public onSubmit(attribute: Attribute) {
    const newAttribute = {
      ...attribute,
      function: {...attribute.function, js: this.js, xml: this.xml, editable: this.editable$.getValue()},
    };
    this.onAttributeChange(newAttribute);
  }

  public onJsUpdate(jsCode: string) {
    this.js = jsCode;
  }

  public onXmlUpdate(xmlCode: string) {
    this.xml = xmlCode;
  }

  public display(type: BlocklyDebugDisplay) {
    if (type !== BlocklyDebugDisplay.DisplayNone && this.displayDebug === type) {
      this.display(BlocklyDebugDisplay.DisplayNone);
    } else {
      this.displayDebug = type;
    }
  }

  public switchEditable() {
    this.editable$.next(!this.editable$.getValue());
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.code === KeyCode.Escape && !this.performingAction$.getValue()) {
      this.hideDialog();
    }
  }
}
