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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {skipWhile} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {selectLinkTypeById} from '../../../../core/store/link-types/link-types.state';
import {SmartDocPartModel} from '../../../../core/store/smartdoc/smartdoc.model';
import {HtmlModifier} from '../../../../shared/utils/html-modifier';
import {Perspective, perspectiveIconsMap} from '../../perspective';

@Component({
  selector: 'smartdoc-bottom-panel',
  templateUrl: './smartdoc-bottom-panel.component.html',
  styleUrls: ['./smartdoc-bottom-panel.component.scss']
})
export class SmartDocBottomPanelComponent implements OnInit, OnDestroy {

  @Input()
  public part: SmartDocPartModel;

  @Input()
  public single: boolean;

  @Input()
  public perspectives: Perspective[] = [];

  @Output()
  public switchPerspective = new EventEmitter<Perspective>();

  @Output()
  public copyPart = new EventEmitter();

  @Output()
  public removePart = new EventEmitter();

  public linkType: LinkTypeModel;
  private linkTypeSubscription: Subscription;

  public constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    if (this.part.linkTypeId) {
      this.linkTypeSubscription = Observable.combineLatest(
        this.store.select(selectLinkTypeById(this.part.linkTypeId)),
        this.store.select(selectAllCollections)
      ).pipe(
        skipWhile(([linkType]) => !linkType)
      ).subscribe(([linkType, allCollections]) => {
        const collectionsMap = new Map(allCollections.map(collection => [collection.id, collection] as [string, CollectionModel]));
        const collections: [CollectionModel, CollectionModel] = [collectionsMap.get(linkType.collectionIds[0]), collectionsMap.get(linkType.collectionIds[1])];
        this.linkType = {...linkType, collections};
      });
    }
  }

  public ngOnDestroy() {
    if (this.linkTypeSubscription) {
      this.linkTypeSubscription.unsubscribe();
    }
  }

  public onSwitchPerspective(perspective: Perspective) {
    this.switchPerspective.emit(perspective);
  }

  public onCopyPart() {
    this.copyPart.emit();
  }

  public onRemovePart() {
    this.removePart.emit();
  }

  public perspectiveIcon(perspective: Perspective): string {
    return perspectiveIconsMap[perspective];
  }

  public removeHtmlComments(html: HTMLElement): string {
    return HtmlModifier.removeHtmlComments(html);
  }

}
