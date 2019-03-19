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
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {Attribute, Collection} from '../../core/store/collections/collection';
import {ActivatedRoute} from '@angular/router';
import {DialogService} from '../dialog.service';
import {select, Store} from '@ngrx/store';
import {filter, first, map, mergeMap, tap} from 'rxjs/operators';
import {selectAllCollections, selectCollectionById} from '../../core/store/collections/collections.state';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {BLOCKLY_VALUE_TOOLBOX} from '../../shared/blockly/blockly-editor/blockly-editor-toolbox';
import {RuleVariable} from '../../collection/settings/tab/rules/rule-variable-type';
import {MasterBlockType} from '../../shared/blockly/blockly-editor/blockly-editor.component';
import {LinkType} from '../../core/store/link-types/link.type';
import {selectLinkTypesByCollectionId} from '../../core/store/common/permissions.selectors';
import {BlocklyDebugDisplay} from '../../shared/blockly/blockly-debugger/blockly-debugger.component';
import {selectAllLinkTypes, selectLinkTypeById} from '../../core/store/link-types/link-types.state';
import {LinkTypesAction} from '../../core/store/link-types/link-types.action';

@Component({
  selector: 'attribute-function-dialog',
  templateUrl: './attribute-function-dialog.component.html',
  styleUrls: ['./attribute-function-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeFunctionDialogComponent implements OnInit {
  public valueToolbox = BLOCKLY_VALUE_TOOLBOX;
  public masterValueType = MasterBlockType.Value;
  public masterLinkType = MasterBlockType.Link;
  public variables$: Observable<RuleVariable[]>;

  public collections$: Observable<Collection[]>;
  public collection$: Observable<Collection>;
  public attribute$: Observable<Attribute>;
  public linkTypes$: Observable<LinkType[]>;
  public linkType$: Observable<LinkType>;

  public displayDebug: BlocklyDebugDisplay;
  public debugButtons: BlocklyDebugDisplay[] = [BlocklyDebugDisplay.DisplayJs, BlocklyDebugDisplay.DisplayError];

  public saveClicked$ = new BehaviorSubject<boolean>(false);

  public js: string = '';
  private xml: string = '';
  public editable$ = new BehaviorSubject<boolean>(undefined);

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: DialogService,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.collections$ = this.store$.select(selectAllCollections);
    this.collection$ = this.selectCollection();
    this.linkType$ = this.selectLinkType();

    this.attribute$ = this.selectAttribute(this.selectAttributes(this.collection$, this.linkType$));
    this.linkTypes$ = this.store$.select(selectAllLinkTypes); // this.selectLinkTypes();
    this.variables$ = this.selectVariables();

    this.attribute$
      .pipe(first())
      .subscribe(attribute => this.editable$.next(attribute.function ? attribute.function.editable : false));
  }

  private selectVariables(): Observable<RuleVariable[]> {
    return this.activatedRoute.paramMap.pipe(
      map(params => ({collectionId: params.get('collectionId'), linkTypeId: params.get('linkTypeId')})),
      map(({collectionId, linkTypeId}) => {
        const variables = [];
        if (collectionId) {
          variables.push({name: 'thisDocument', collectionId} as RuleVariable);
        }
        if (linkTypeId) {
          variables.push({name: 'thisLink', linkTypeId} as RuleVariable);
        }
        return variables;
      })
    );
  }

  private selectCollection(): Observable<Collection> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      mergeMap(collectionId => (collectionId ? this.store$.pipe(select(selectCollectionById(collectionId))) : of(null)))
    );
  }

  private selectLinkType(): Observable<LinkType> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('linkTypeId')),
      mergeMap(linkTypeId => (linkTypeId ? this.store$.pipe(select(selectLinkTypeById(linkTypeId))) : of(null)))
    );
  }

  private selectAttributes(
    collection$: Observable<Collection>,
    linkType$: Observable<LinkType>
  ): Observable<Attribute[]> {
    return combineLatest(collection$, linkType$).pipe(
      map(([collection, linkType]) => {
        if (collection) {
          return collection.attributes;
        }
        if (linkType) {
          return linkType.attributes;
        }
        return [];
      })
    );
  }

  private selectAttribute(attributes$: Observable<Attribute[]>): Observable<Attribute> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('attributeId')),
      filter(attributeId => !!attributeId),
      mergeMap(attributeId => {
        return attributes$.pipe(
          map(attributes => attributes.find(attribute => attribute.id === attributeId)),
          filter(attribute => !!attribute)
        );
      })
    );
  }

  private selectLinkTypes(): Observable<LinkType[]> {
    return this.activatedRoute.paramMap.pipe(
      map(params => params.get('collectionId')),
      filter(collectionId => !!collectionId),
      mergeMap(collectionId => this.store$.pipe(select(selectLinkTypesByCollectionId(collectionId))))
    );
  }

  public onAttributeChange(collectionId: string, linkTypeId: string, attribute: Attribute) {
    if (collectionId) {
      this.updateCollectionAttribute(collectionId, attribute);
    }
    if (linkTypeId) {
      this.updateLinkTypeAttribute(linkTypeId, attribute);
    }
  }

  public updateCollectionAttribute(collectionId: string, attribute: Attribute) {
    this.store$.dispatch(
      new CollectionsAction.ChangeAttribute({
        collectionId,
        attributeId: attribute.id,
        attribute,
        onSuccess: () => {
          this.saveClicked$.next(true);
        },
        onFailure: () => this.saveClicked$.next(false),
      })
    );
    this.dialogService.closeFullscreenDialog();
  }

  private updateLinkTypeAttribute(linkTypeId: string, attribute: Attribute) {
    this.store$.dispatch(
      new LinkTypesAction.UpdateAttribute({
        linkTypeId,
        attributeId: attribute.id,
        attribute,
        onSuccess: () => {
          this.saveClicked$.next(true);
        },
        onFailure: () => this.saveClicked$.next(false),
      })
    );
    this.dialogService.closeFullscreenDialog();
  }

  public onSubmit(collectionId: string, linkTypeId: string, attribute: Attribute) {
    attribute.function = {...attribute.function, js: this.js, xml: this.xml, editable: this.editable$.getValue()};
    this.onAttributeChange(collectionId, linkTypeId, attribute);
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

  public onClose(event: MouseEvent) {
    let blocklyClick = false;
    (event.target as HTMLElement).classList.forEach(
      classItem => (blocklyClick = blocklyClick || classItem.indexOf('blockly') >= 0)
    );

    if (!blocklyClick) {
      this.dialogService.closeFullscreenDialog();
    }
  }

  public switchEditable() {
    this.editable$.next(!this.editable$.getValue());
  }
}
