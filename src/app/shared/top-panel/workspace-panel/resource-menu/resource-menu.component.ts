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
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {ResourceType} from '../../../../core/model/resource-type';
import {AppState} from '../../../../core/store/app.state';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {ProjectsAction} from '../../../../core/store/projects/projects.action';
import {Resource} from '../../../../core/model/resource';
import {DropdownPosition} from '../../../dropdown/dropdown-position';
import {DropdownComponent} from '../../../dropdown/dropdown.component';

@Component({
  selector: 'resource-menu',
  templateUrl: './resource-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceMenuComponent implements OnChanges, OnDestroy {
  @Input()
  public type: ResourceType;

  @Input()
  public resource: Resource;

  @Input()
  public workspace: Workspace;

  @Input()
  public origin: ElementRef | HTMLElement;

  @Input()
  public organizations: Organization[];

  @Input()
  public projects: Project[];

  @Output()
  public onNewResource = new EventEmitter<ResourceType>();

  @Output()
  public onResourceSelect = new EventEmitter<Resource>();

  @ViewChild(DropdownComponent)
  public dropdown: DropdownComponent;

  public readonly dropdownPositions = [DropdownPosition.BottomStart];

  constructor(private store$: Store<AppState>) {}

  public isOrganizationType(): boolean {
    return this.type === ResourceType.Organization;
  }

  public newResource(): void {
    this.onNewResource.emit(this.type);
    this.close();
  }

  public selectResource(resource: Resource): void {
    this.onResourceSelect.emit(resource);
    this.close();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!this.isOrganizationType()) {
      this.store$.dispatch(new ProjectsAction.Get({organizationId: (this.resource as Project).organizationId}));
    }
  }

  public open() {
    if (this.dropdown) {
      this.dropdown.open();
    }
  }

  public close() {
    if (this.dropdown) {
      this.dropdown.close();
    }
  }

  public ngOnDestroy() {
    this.close();
  }
}
