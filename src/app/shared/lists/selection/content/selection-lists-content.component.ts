import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {ResourceType} from '../../../../core/model/resource-type';
import {objectChanged} from '../../../utils/common.utils';
import {SelectionList} from '../selection-list';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'selection-lists-content',
  templateUrl: './selection-lists-content.component.html',
  styleUrls: ['./selection-lists-content.component.scss']
})
export class SelectionListsContentComponent implements OnChanges {

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public resourceType: ResourceType;

  public lists$: Observable<SelectionList[]>;

  constructor(private store$: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resourceType || objectChanged(changes.organization) || objectChanged(changes.project)) {
      this.subscribeLists();
    }
  }

  private subscribeLists() {
    this.lists$ = of([]);
  }

  public trackByList(index: number, list: SelectionList): string {
    return list.id;
  }

}
