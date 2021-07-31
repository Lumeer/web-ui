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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {FileAttachment} from '../../../../../../../../core/store/file-attachments/file-attachment.model';
import {selectFileAttachmentsByDataCursor} from '../../../../../../../../core/store/file-attachments/file-attachments.state';
import {LinkInstance} from '../../../../../../../../core/store/link-instances/link.instance';
import {
  createDocumentDataCursor,
  createLinkDataCursor,
  DataCursor,
} from '../../../../../../../../shared/data-input/data-cursor';
import {AppState} from '../../../../../../../../core/store/app.state';

@Component({
  selector: 'files-collapsed-cell',
  templateUrl: './files-collapsed-cell.component.html',
  styleUrls: ['./files-collapsed-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilesCollapsedCellComponent implements OnInit, OnChanges {
  @Input()
  public attributeId: string;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkInstances: LinkInstance[];

  public fileAttachments$: Observable<FileAttachment[]>;

  private cursors$ = new BehaviorSubject<DataCursor[]>([]);

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.fileAttachments$ = this.bindFileAttachments();
  }

  private bindFileAttachments(): Observable<FileAttachment[]> {
    return this.cursors$.pipe(
      switchMap(cursors =>
        combineLatest(cursors.map(cursor => this.store$.pipe(select(selectFileAttachmentsByDataCursor(cursor))))).pipe(
          map(filesArrays =>
            filesArrays.reduce((reducedFiles, files) => {
              reducedFiles.push(...files);
              return reducedFiles;
            }, [])
          )
        )
      )
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    const cursors = this.createCursors().filter(cursor => cursor.documentId || cursor.linkInstanceId);
    this.cursors$.next(cursors);
  }

  private createCursors(): DataCursor[] {
    if (this.attributeId && this.documents && this.documents.length > 0) {
      return this.documents.map(document => createDocumentDataCursor(document, this.attributeId));
    }

    if (this.attributeId && this.linkInstances && this.linkInstances.length > 0) {
      return this.linkInstances.map(linkInstance => createLinkDataCursor(linkInstance, this.attributeId));
    }

    return [];
  }
}
