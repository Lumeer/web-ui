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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {LinkTypeModel} from '../../../../../core/store/link-types/link-type.model';
import {AppState} from '../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {selectLinkInstancesByType} from '../../../../../core/store/link-instances/link-instances.state';
import {BehaviorSubject, Subscription} from 'rxjs';

@Component({
  selector: '[link-type]',
  templateUrl: './link-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeComponent implements OnInit, OnDestroy, OnChanges {
  @Input()
  public linkType: LinkTypeModel;

  @Output()
  public delete = new EventEmitter<number>();

  public linksCount = new BehaviorSubject<number>(0);

  private linksCountSubscription = new Subscription();

  constructor(private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeLinks();
  }

  private subscribeLinks() {
    this.linksCountSubscription.unsubscribe();
    if (this.linkType) {
      this.linksCountSubscription = this.store
        .select(selectLinkInstancesByType(this.linkType.id))
        .subscribe(linkInstances => this.linksCount.next(linkInstances.length));
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    this.subscribeLinks();
  }

  public ngOnDestroy() {
    this.linksCountSubscription.unsubscribe();
  }

  public onDelete() {
    this.delete.emit(this.linksCount.getValue());
  }
}
