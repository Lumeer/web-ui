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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnInit} from '@angular/core';
import {QueryParam} from '../../../../../core/store/navigation/query-param';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {SearchDocumentsConfig} from '../../../../../core/store/searches/search';
import {Collection} from '../../../../../core/store/collections/collection';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {Query} from '../../../../../core/store/navigation/query/query';
import {Workspace} from '../../../../../core/store/navigation/workspace';
import {SizeType} from '../../../../../shared/slider/size-type';
import {PerspectiveService} from '../../../../../core/service/perspective.service';
import {Router} from '@angular/router';
import {Perspective} from '../../../perspective';
import {SearchTab} from '../../../../../core/store/navigation/search-tab';
import {convertQueryModelToString} from '../../../../../core/store/navigation/query/query.converter';
import {DocumentFavoriteToggleService} from '../../../../../shared/toggle/document-favorite-toggle.service';
import {ResourceType} from '../../../../../core/model/resource-type';
import {CreateDocumentModalComponent} from '../../../../../shared/modal/create-document/create-document-modal.component';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {ModalService} from '../../../../../shared/modal/modal.service';
import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';

@Component({
  selector: 'search-documents-content',
  templateUrl: './search-documents-content.component.html',
  styleUrls: ['./search-documents-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DocumentFavoriteToggleService],
})
export class SearchDocumentsContentComponent implements OnInit {
  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: SearchDocumentsConfig;

  @Input()
  public collections: Collection[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public maxDocuments: number;

  @Input()
  public query: Query;

  @Input()
  public workspace: Workspace;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Output()
  public configChange = new EventEmitter<SearchDocumentsConfig>();

  public readonly configuration: DataInputConfiguration = {color: {limitWidth: true}};
  public readonly projectType = ResourceType.Project;
  public readonly sizeType = SizeType;

  constructor(
    private perspectiveService: PerspectiveService,
    private router: Router,
    private toggleService: DocumentFavoriteToggleService,
    private modalService: ModalService
  ) {}

  public ngOnInit() {
    this.toggleService.setWorkspace(this.workspace);
  }

  public onDetailClick(document: DocumentModel) {
    const collection = (this.collections || []).find(coll => coll.id === document.collectionId);
    this.perspectiveService.switchPerspective(Perspective.Detail, collection, document);
  }

  public switchPerspectiveToTable() {
    this.perspectiveService.switchPerspective(Perspective.Table);
  }

  public trackByDocument(index: number, document: DocumentModel): string {
    return document.id;
  }

  public onSizeChange(size: SizeType) {
    this.configChange.next({...this.config, size});
  }

  private isDocumentExplicitlyExpanded(document: DocumentModel): boolean {
    return ((this.config && this.config.expandedIds) || []).includes(document.id);
  }

  public toggleDocument(document: DocumentModel) {
    const expandedIds = (this.config && this.config.expandedIds) || [];
    const newExpandedIds = this.isDocumentExplicitlyExpanded(document)
      ? expandedIds.filter(id => id !== document.id)
      : [...expandedIds, document.id];
    this.configChange.next({...this.config, expandedIds: newExpandedIds});
  }

  public onShowAll() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, SearchTab.Records], {
      queryParams: {[QueryParam.Query]: convertQueryModelToString(this.query)},
    });
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }

  public onFavoriteToggle(document: DocumentModel) {
    this.toggleService.set(document.id, !document.favorite, document);
  }

  public ngOnDestroy() {
    this.toggleService.onDestroy();
  }

  public onAdd(collections: Collection[]) {
    if (collections.length) {
      const initialState = {collections, query: this.query, constraintData: this.constraintData};
      const config = {initialState, keyboard: false};
      config['backdrop'] = 'static';
      this.modalService.show(CreateDocumentModalComponent, config);
    }
  }
}
