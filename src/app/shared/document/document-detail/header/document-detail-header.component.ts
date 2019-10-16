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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  SimpleChanges,
  EventEmitter,
  Output,
  OnInit,
  OnChanges,
  OnDestroy,
} from '@angular/core';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {selectUserById} from '../../../../core/store/users/users.state';
import {filter, map} from 'rxjs/operators';
import {Perspective, perspectiveIconsMap} from '../../../../view/perspectives/perspective';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {DocumentFavoriteToggleService} from '../../../toggle/document-favorite-toggle.service';
import {Workspace} from '../../../../core/store/navigation/workspace';

@Component({
  selector: 'document-detail-header',
  templateUrl: './document-detail-header.component.html',
  styleUrls: ['./document-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class DocumentDetailHeaderComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public defaultAttribute: Attribute;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public workspace: Workspace;

  @Output()
  public switchToTable = new EventEmitter();

  @Output()
  public removeDocument = new EventEmitter();

  public readonly tableIcon = perspectiveIconsMap[Perspective.Table];

  public createdBy$: Observable<string>;
  public updatedBy$: Observable<string>;

  constructor(private store$: Store<AppState>, private toggleService: DocumentFavoriteToggleService) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.document) {
      this.renewSubscriptions();
    }
  }

  private renewSubscriptions() {
    if (this.document) {
      this.createdBy$ = this.store$.pipe(
        select(selectUserById(this.document.createdBy)),
        filter(user => !!user),
        map(user => user.name || user.email || 'Guest')
      );
      this.updatedBy$ = this.store$.pipe(
        select(selectUserById(this.document.updatedBy)),
        filter(user => !!user),
        map(user => user.name || user.email || 'Guest')
      );
    }
  }

  public onSwitchToTable() {
    this.switchToTable.emit();
  }

  public onFavoriteToggle() {
    if (this.document) {
      this.toggleService.set(this.document.id, !this.document.favorite, this.document);
    }
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }

  public onRemoveDocument() {
    this.removeDocument.emit();
  }
}
