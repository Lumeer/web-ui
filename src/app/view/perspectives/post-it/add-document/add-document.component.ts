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

import {Component, EventEmitter, Output} from '@angular/core';
import {Store} from '@ngrx/store';

import {Document, Query} from '../../../../core/dto';
import {AppState} from '../../../../core/store/app.state';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {Subscription} from 'rxjs/Rx';

@Component({
  selector: 'add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class PostItAddDocumentComponent {

  @Output()
  public newDocument = new EventEmitter<Document>();

  public query: Query;

  private appStateSubscription: Subscription;

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.getAppStateAndInitialize();
  }

  private getAppStateAndInitialize() {
    this.appStateSubscription = this.store.select(selectQuery).subscribe(query => this.query = query);
  }

  public onClick(): void {
    const newDocument = new Document;
    newDocument.collectionCode = this.query.collectionCodes[0];

    this.newDocument.emit(newDocument);
  }

  public ngOnDestroy(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.unsubscribe();
    }
  }

}
