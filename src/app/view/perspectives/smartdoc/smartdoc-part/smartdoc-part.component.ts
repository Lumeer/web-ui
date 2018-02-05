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

import {Component, EventEmitter, Input, NgZone, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {SmartDocAction} from '../../../../core/store/smartdoc/smartdoc.action';
import {SmartDocPartModel} from '../../../../core/store/smartdoc/smartdoc.model';
import {Perspective} from '../../perspective';

@Component({
  selector: 'smartdoc-part',
  templateUrl: './smartdoc-part.component.html',
  styleUrls: ['./smartdoc-part.component.scss']
})
export class SmartDocPartComponent {

  @Input()
  public collection: CollectionModel;

  @Input()
  public document: DocumentModel;

  @Input()
  public part: SmartDocPartModel;

  @Input()
  public path: number[];

  @Input()
  public selected: boolean;

  @Input()
  public single: boolean;

  @Output()
  public add = new EventEmitter<SmartDocPartModel>();

  @Output()
  public update = new EventEmitter<SmartDocPartModel>();

  @Output()
  public copy = new EventEmitter();

  @Output()
  public remove = new EventEmitter();

  @Output()
  public select = new EventEmitter<boolean>();

  public constructor(private store: Store<AppState>,
                     private zone: NgZone) {
  }

  public onClickInside(event: MouseEvent) {
    if (event['templateSelected']) {
      return;
    }
    event['templateSelected'] = true;

    if (!this.selected) {
      this.select.emit(true);
    }
  }

  public onClickOutside() {
    if (this.selected) {
      this.select.emit(false);
    }
  }

  public allowedPerspectives(): Perspective[] {
    return [Perspective.Table, Perspective.SmartDoc];
  }

  public onAddPart(part: SmartDocPartModel) {
    this.add.emit(part);
  }

  public onUpdatePart(part: SmartDocPartModel) {
    this.update.emit(part);
  }

  public onCopyPart() {
    this.copy.emit();
  }

  public onRemovePart() {
    this.remove.emit();
  }

  public onSwitchPerspective(perspective: Perspective) {
    const part: SmartDocPartModel = {...this.part, perspective};
    this.onUpdatePart(part);
  }

}
