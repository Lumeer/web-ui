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

import {Component, Input, NgZone, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {SmartDocAction} from '../../../../core/store/smartdoc/smartdoc.action';
import {SmartDocModel, SmartDocPartModel} from '../../../../core/store/smartdoc/smartdoc.model';
import {selectSelectedSmartDocPart} from '../../../../core/store/smartdoc/smartdoc.state';
import {GridLayout} from '../../../../shared/utils/layout/grid-layout';
import {SmartDocUtils} from '../smartdoc.utils';

@Component({
  selector: 'smartdoc-document',
  templateUrl: './smartdoc-document.component.html',
  styleUrls: ['./smartdoc-document.component.scss']
})
export class SmartDocDocumentComponent implements OnInit {

  @Input()
  public collection: CollectionModel;

  @Input()
  public document: DocumentModel;

  @Input()
  public path: number[];

  @Input()
  public smartDoc: SmartDocModel;

  public selectedPartIndex: number;
  private selectedPartSubscription: Subscription;

  private partsLayout: GridLayout;

  public constructor(private store: Store<AppState>,
                     private zone: NgZone) {
  }

  public ngOnInit() {
    this.selectedPartSubscription = this.store.select(selectSelectedSmartDocPart).subscribe((selected) => {
      this.selectedPartIndex = selected && (JSON.stringify(this.path) === JSON.stringify(selected.path))
      && selected.documentId === this.document.id ? selected.partIndex : null;
    });
  }

  public ngOnChanges() {
    this.refreshLayout();
  }

  public ngOnDestroy() {
    this.destroyLayout();
  }

  public onAddPart(partIndex: number, part: SmartDocPartModel) {
    this.store.dispatch(new SmartDocAction.AddPart({partPath: this.path, partIndex: partIndex + 1, part}));
  }

  public onUpdatePart(partIndex: number, part: SmartDocPartModel) {
    this.store.dispatch(new SmartDocAction.UpdatePart({partPath: this.path, partIndex: partIndex, part: part}));
  }

  public onRemovePart(partIndex: number) {
    this.store.dispatch(new SmartDocAction.RemovePartConfirm({partPath: this.path, partIndex: partIndex, last: this.hasSinglePart()}));
  }

  public onCopyPart(partIndex: number) {
    const part = this.smartDoc.parts[partIndex];
    this.store.dispatch(new SmartDocAction.AddPart({partPath: this.path, partIndex: partIndex + 1, part}));
  }

  public onSelectPart(partIndex: number, select: boolean) {
    const payload = select ? {path: this.path, documentId: this.document.id, partIndex} : null;
    this.store.dispatch(new SmartDocAction.Select(payload));
  }

  private refreshLayout() {
    this.destroyLayout();
    this.initLayout();
  }

  private initLayout() {
    const containerClass = this.layoutContainerClass();
    this.partsLayout = new GridLayout('.' + containerClass, {
      dragEnabled: true,
      dragAxis: 'y',
      dragStartPredicate: (item, event) => SmartDocDocumentComponent.canDragWithElement(event.target, containerClass)
    }, this.zone, ({fromIndex, toIndex}) => this.onMovePart(fromIndex, toIndex));
  }

  public layoutContainerClass(): string {
    return `parts-layout-${SmartDocUtils.pathToString(this.path)}-${this.document.id}`;
  }

  public recordMoverClass(): string {
    return `record-mover-${SmartDocUtils.pathToString(this.path)}`;
  }

  private static canDragWithElement(element: Element, containerClass: string): boolean {
    let currentElement = element;
    while (!currentElement.classList.contains(containerClass)) {
      if (currentElement.classList.contains('muuri')) {
        return false;
      }
      currentElement = currentElement.parentElement;
    }
    return true;
  }

  private destroyLayout() {
    if (this.partsLayout) {
      this.partsLayout.destroy();
    }
  }

  public onMovePart(oldIndex: number, newIndex: number) {
    this.store.dispatch(new SmartDocAction.MovePart({partPath: this.path, oldIndex, newIndex}));
    this.store.dispatch(new SmartDocAction.Select({path: this.path, documentId: this.document.id, partIndex: newIndex}));
  }

  public hasSinglePart(): boolean {
    return this.smartDoc.parts.length === 1;
  }

}
