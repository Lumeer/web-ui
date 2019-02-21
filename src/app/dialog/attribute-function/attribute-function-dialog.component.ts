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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from '../dialog.service';
import {select, Store} from '@ngrx/store';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {selectAllCollections, selectCollectionById} from '../../core/store/collections/collections.state';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {
  BLOCKLY_FUNCTION_TOOLBOX,
  BLOCKLY_VALUE_TOOLBOX,
} from '../../shared/blockly/blockly-editor/blockly-editor-toolbox';
import {RuleVariable} from '../../collection/settings/tab/rules/rule-variable-type';
import {MasterBlockType} from '../../shared/blockly/blockly-editor/blockly-editor.component';
import {LinkType} from '../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../core/store/common/permissions.selectors';
import {BlocklyDebugDisplay} from '../../shared/blockly/blockly-debugger/blockly-debugger.component';

@Component({
  selector: 'attribute-function-dialog',
  templateUrl: './attribute-function-dialog.component.html',
  styleUrls: ['./attribute-function-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionDialogComponent implements OnInit {
  public valueToolbox = BLOCKLY_VALUE_TOOLBOX;
  public masterValueType = MasterBlockType.Value;
  public variables$: Observable<RuleVariable[]>;

  public collections$: Observable<Collection[]>;
  public collection$: Observable<Collection>;
  public attribute$: Observable<Attribute>;
  public linkTypes$: Observable<LinkType[]>;

  public displayDebug: BlocklyDebugDisplay;
  public debugButtons: BlocklyDebugDisplay[] = [BlocklyDebugDisplay.DisplayJs, BlocklyDebugDisplay.DisplayError];

  public js: string = '';
  private xml: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.collections$ = this.store$.select(selectAllCollections);
    this.collection$ = this.selectCollection();
    this.attribute$ = this.selectAttribute(this.collection$);
    this.linkTypes$ = this.selectLinkTypes();
    this.variables$ = this.selectVariables();
  }

  private selectVariables(): Observable<RuleVariable[]> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      filter(collectionId => !!collectionId),
      map(collectionId => [{name: 'thisDocument', collectionId} as RuleVariable])
    );
  }

  private selectCollection(): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      filter(collectionId => !!collectionId),
      mergeMap(collectionId => this.store$.pipe(select(selectCollectionById(collectionId))))
    );
  }

  private selectAttribute(collection$: Observable<Collection>): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('attributeId')),
      filter(attributeId => !!attributeId),
      mergeMap(attributeId =>
        collection$.pipe(
          map(collection => collection && collection.attributes.find(attribute => attribute.id === attributeId)),
          filter(attribute => !!attribute)
        )
      )
    );
  }

  private selectLinkTypes(): Observable<LinkType[]> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      filter(collectionId => !!collectionId),
      mergeMap(collectionId => this.store$.pipe(select(selectLinkTypesByCollectionId(collectionId))))
    );
  }

  public onAttributeChange(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
        attributeId: attribute.id,
        attribute,
        onSuccess: () => this.dialogService.closeDialog(),
      })
    );
  }

  public onSubmit(collection: Collection, attribute: Attribute) {
    attribute.function = {...attribute.function, js: this.js, xml: this.xml};
    this.onAttributeChange(collection.id, attribute);
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
}
