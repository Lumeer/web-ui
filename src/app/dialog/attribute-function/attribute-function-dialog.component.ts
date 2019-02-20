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
import {filter, map, mergeMap} from 'rxjs/operators';
import {selectCollectionById} from '../../core/store/collections/collections.state';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {BLOCKLY_VALUE_TOOLBOX} from '../../shared/blockly-editor/blockly-editor-toolbox';
import {RuleVariable} from '../../collection/settings/tab/rules/rule-variable-type';
import {MasterBlockType} from '../../shared/blockly-editor/blockly-editor.component';
import {LinkType} from '../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../core/store/common/permissions.selectors';

@Component({
  selector: 'attribute-function-dialog',
  templateUrl: './attribute-function-dialog.component.html',
  styleUrls: ['./attribute-function-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionDialogComponent implements OnInit {
  public valueToolbox = BLOCKLY_VALUE_TOOLBOX;
  public masterValueType = MasterBlockType.Value;
  public variables: RuleVariable[];

  public collection$: Observable<Collection>;
  public attribute$: Observable<Attribute>;
  public linkTypes$: Observable<LinkType[]>;

  public width = 850;

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.collection$ = this.selectCollection();
    this.attribute$ = this.selectAttribute(this.collection$);
    this.linkTypes$ = this.selectLinkTypes();
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

  public onSubmit() {
    // to save
  }

  public onJsUpdate(jsCode: string) {
    //    this.form.get('blocklyJs').setValue(jsCode);
  }

  public onXmlUpdate(xmlCode: string) {
    //    this.form.get('blocklyXml').setValue(xmlCode);
  }
}
