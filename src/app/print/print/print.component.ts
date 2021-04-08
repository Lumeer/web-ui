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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {combineLatest, Observable, of} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {DocumentsAction} from '../../core/store/documents/documents.action';
import {selectDocumentById} from '../../core/store/documents/documents.state';
import {ResourceType} from '../../core/model/resource-type';
import {LinkInstancesAction} from '../../core/store/link-instances/link-instances.action';
import {selectLinkInstanceById} from '../../core/store/link-instances/link-instances.state';
import {PrintService} from '../../core/service/print.service';

@Component({
  selector: 'print',
  templateUrl: './print.component.html',
  styleUrls: ['./print.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintComponent implements OnInit {
  public value$: Observable<any>;

  constructor(
    private store$: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private printService: PrintService
  ) {}

  public ngOnInit(): void {
    this.value$ = this.activatedRoute.paramMap.pipe(
      tap(paramMap => this.fetchDocument(paramMap)),
      mergeMap(paramMap => {
        const resourceType = paramMap.get('resourceType');
        const documentId = paramMap.get('documentId');
        const attributeId = paramMap.get('attributeId');

        if (resourceType === 'text') {
          return of(this.printService.getContent());
        }

        return combineLatest([
          this.store$.pipe(select(selectWorkspace)),
          resourceType === ResourceType.Collection
            ? this.store$.pipe(select(selectDocumentById(documentId)))
            : this.store$.pipe(select(selectLinkInstanceById(documentId))),
        ]).pipe(
          filter(([w, d]) => !!w && !!d),
          map(([, d]) => d.data[attributeId]),
          tap(() => setTimeout(() => window.print(), 3000))
        );
      })
    );
  }

  private fetchDocument(paramMap: any) {
    const resourceType = paramMap.get('resourceType');
    const resourceId = paramMap.get('resourceId');
    const documentId = paramMap.get('documentId');

    if (resourceType === ResourceType.Collection) {
      this.store$.dispatch(new DocumentsAction.GetSingle({collectionId: resourceId, documentId}));
    } else if (resourceType === ResourceType.Link) {
      this.store$.dispatch(new LinkInstancesAction.GetSingle({linkTypeId: resourceId, linkInstanceId: documentId}));
    }
  }
}
