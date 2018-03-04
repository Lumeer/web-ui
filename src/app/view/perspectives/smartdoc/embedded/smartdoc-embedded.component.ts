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

import {Component, ComponentFactoryResolver, ComponentRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, Type, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {Observable} from 'rxjs/Observable';
import {skipWhile} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {getOtherLinkedDocumentId, LinkInstanceModel} from '../../../../core/store/link-instances/link-instance.model';
import {selectLinkInstancesByType} from '../../../../core/store/link-instances/link-instances.state';
import {LinkTypeHelper} from '../../../../core/store/link-types/link-type.helper';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {selectLinkTypeById} from '../../../../core/store/link-types/link-types.state';
import {QueryModel} from '../../../../core/store/navigation/query.model';
import {SmartDocPartModel} from '../../../../core/store/smartdoc/smartdoc.model';
import {PerspectiveDirective} from '../../../../shared/perspective.directive';
import {Perspective} from '../../perspective';
import {PerspectiveComponent} from '../../perspective.component';
import {TablePerspectiveComponent} from '../../table/table-perspective.component';
import {SmartDocPerspectiveComponent} from '../smartdoc-perspective.component';
import {SmartDocUtils} from '../smartdoc.utils';

const perspectiveComponents: { [perspective: string]: Type<any> } = {
  [Perspective.Table]: TablePerspectiveComponent,
  [Perspective.SmartDoc]: SmartDocPerspectiveComponent
};

@Component({
  selector: 'smartdoc-embedded',
  templateUrl: './smartdoc-embedded.component.html',
  styleUrls: ['./smartdoc-embedded.component.scss']
})
export class SmartDocEmbeddedComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  public document: DocumentModel;

  @Input()
  public path: number[];

  @Input()
  public part: SmartDocPartModel;

  @Output()
  public templatePartChange = new EventEmitter<SmartDocPartModel>();

  @ViewChild(PerspectiveDirective)
  public perspectiveDirective: PerspectiveDirective;

  private perspectiveComponent: PerspectiveComponent;

  private linkSubscription: Subscription;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.store.dispatch(new LinkTypesAction.Get({query: {linkTypeIds: [this.part.linkTypeId]}, loadInstances: true}));

    this.linkSubscription = Observable.combineLatest(
      this.store.select(selectLinkTypeById(this.part.linkTypeId)),
      this.store.select(selectLinkInstancesByType(this.part.linkTypeId))
    ).pipe(
      skipWhile(([linkType]) => !linkType)
    ).subscribe(([linkType, linkInstances]) => this.loadPerspective(linkType, linkInstances));
  }

  public ngOnChanges(changes: SimpleChanges) {
    // TODO reload on relevant changes
  }

  public ngOnDestroy() {
    if (this.linkSubscription) {
      this.linkSubscription.unsubscribe();
    }
  }

  private loadPerspective(linkType: LinkTypeModel, linkInstances: LinkInstanceModel[]) {
    if (!SmartDocUtils.isValidEmbeddedPart(this.part)) {
      console.error('Invalid embedded part', this.part);
      return;
    }

    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(perspectiveComponents[this.part.perspective]);

    const viewContainerRef = this.perspectiveDirective.viewContainerRef;
    viewContainerRef.clear();

    const componentRef: ComponentRef<PerspectiveComponent> = viewContainerRef.createComponent(componentFactory);
    this.perspectiveComponent = componentRef.instance;

    this.perspectiveComponent.embedded = true;
    this.perspectiveComponent.linkedDocument = this.document;

    const collectionId = LinkTypeHelper.getOtherCollectionId(linkType, this.document.collectionId);
    const query: QueryModel = {
      documentIds: this.getLinkedDocumentIds(linkInstances),
      collectionIds: [collectionId],
      linkTypeIds: [linkType.id]
    };
    this.perspectiveComponent.query = query;

    const smartDoc = this.part.smartDoc;
    this.perspectiveComponent.config = {smartdoc: smartDoc};

    if (this.part.perspective === Perspective.SmartDoc) {
      this.perspectiveComponent['path'] = this.path;
    }
  }

  private createDocumentIdsFilters(documentIds: string[]): string[] {
    return documentIds.map(id => [this.document.collectionId, 'id', '=' + id].join(':'));
  }

  private getLinkedDocumentIds(linkInstances: LinkInstanceModel[]): string[] {
    return linkInstances.filter(linkInstance => linkInstance.documentIds.includes(this.document.id))
      .map(linkInstance => getOtherLinkedDocumentId(linkInstance, this.document.id));
  }

  public isTablePerspective() {
    return this.part.perspective === Perspective.Table;
  }

  public isTemplatePerspective() {
    return this.part.perspective === Perspective.SmartDoc;
  }

}
