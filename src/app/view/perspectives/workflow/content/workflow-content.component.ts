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
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import {View} from '../../../../core/store/views/view';
import {Query} from '../../../../core/store/navigation/query/query';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {WorkflowConfig} from '../../../../core/store/workflows/workflow';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {WorkflowTablesService} from './tables/service/workflow-tables.service';
import {WorkflowTablesStateService} from './tables/service/workflow-tables-state.service';
import {WorkflowTablesMenuService} from './tables/service/workflow-tables-menu.service';
import {WorkflowTablesDataService} from './tables/service/workflow-tables-data.service';
import {WorkflowTablesKeyboardService} from './tables/service/workflow-tables-keyboard.service';
import {WorkflowPerspectiveConfiguration} from '../../perspective-configuration';
import {BehaviorSubject} from 'rxjs';
import {ViewSettings} from '../../../../core/store/view-settings/view-settings';

@Component({
  selector: 'workflow-content',
  templateUrl: './workflow-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    WorkflowTablesService,
    WorkflowTablesMenuService,
    WorkflowTablesDataService,
    WorkflowTablesStateService,
    WorkflowTablesKeyboardService,
  ],
})
export class WorkflowContentComponent implements AfterViewInit {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public config: WorkflowConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public selectedDocument: DocumentModel;

  @Input()
  public selectedCollection: Collection;

  @Input()
  public sidebarWidth: number;

  @Input()
  public dataLoaded: boolean;

  @Input()
  public currentView: View;

  @Input()
  public workflowId: string;

  @Input()
  public isEmbedded: boolean;

  @Input()
  public perspectiveConfiguration: WorkflowPerspectiveConfiguration;

  @Output()
  public configChange = new EventEmitter<WorkflowConfig>();

  @Output()
  public closeSidebar = new EventEmitter();

  @Output()
  public sidebarResize = new EventEmitter<number>();

  public sidebarData$ = new BehaviorSubject<{initialWidth?: number; minWidth?: number; maxWidth?: number}>({});

  constructor(private element: ElementRef) {}

  public ngAfterViewInit() {
    this.computeInitialSidebarWidth();
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.computeInitialSidebarWidth();
  }

  private computeInitialSidebarWidth() {
    const width = this.element.nativeElement.offsetWidth;
    let initialWidth, minWidth;
    if (width < 500) {
      initialWidth = width;
      minWidth = width;
    } else if (width < 750) {
      initialWidth = width * 0.8;
      minWidth = width * 0.5;
    } else if (width < 1000) {
      initialWidth = width * 0.6;
      minWidth = 350;
    } else {
      initialWidth = width * 0.5;
      minWidth = 400;
    }
    this.sidebarData$.next({maxWidth: width, minWidth, initialWidth});
  }
}
