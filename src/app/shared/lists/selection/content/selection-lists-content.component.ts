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
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {ResourceType} from '../../../../core/model/resource-type';
import {objectChanged} from '../../../utils/common.utils';
import {predefinedSelectionLists, SelectionList} from '../selection-list';
import {Observable} from 'rxjs';
import {ModalService} from '../../../modal/modal.service';
import {SelectionListModalComponent} from './modal/selection-list-modal.component';
import {selectSelectionListsByProjectSorted} from '../../../../core/store/selection-lists/selection-lists.state';
import {SelectionListsAction} from '../../../../core/store/selection-lists/selection-lists.action';

@Component({
  selector: 'selection-lists-content',
  templateUrl: './selection-lists-content.component.html',
  styleUrls: ['./selection-lists-content.component.scss'],
})
export class SelectionListsContentComponent implements OnChanges {
  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public resourceType: ResourceType;

  public readonly predefinedLists = predefinedSelectionLists;

  public lists$: Observable<SelectionList[]>;

  constructor(private store$: Store<AppState>, private modalService: ModalService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || objectChanged(changes.organization) || objectChanged(changes.project)) {
      this.subscribeLists();
    }
  }

  private subscribeLists() {
    this.lists$ = this.store$.pipe(
      select(selectSelectionListsByProjectSorted(this.organization?.id, this.project?.id))
    );
  }

  public trackByList(index: number, list: SelectionList): string {
    return list.id;
  }

  public onAdd() {
    const newList: SelectionList = {name: '', options: []};
    this.showListModal(newList);
  }

  public onUpdate(list: SelectionList) {
    this.showListModal(list);
  }

  private showListModal(list: SelectionList) {
    const initialState = {organizationId: this.organization.id, projectId: this.project.id, list};
    this.modalService.showStaticDialog(initialState, SelectionListModalComponent);
  }

  public onDelete(list: SelectionList) {
    this.store$.dispatch(new SelectionListsAction.DeleteSuccess({id: list.id}));
  }

  public onCopy(list: SelectionList) {
    this.showListModal({...list, id: undefined});
  }
}
