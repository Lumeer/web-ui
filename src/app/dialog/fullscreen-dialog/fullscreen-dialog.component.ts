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

import {ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {DialogService} from '../dialog.service';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {isDialogPathInUrl} from '../dialog.utils';

@Component({
  selector: 'fullscreen-dialog',
  templateUrl: './fullscreen-dialog.component.html',
  styleUrls: ['./fullscreen-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenDialogComponent implements OnInit, OnDestroy {
  public open$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();

  public constructor(private dialogService: DialogService, private router: Router, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToOpenDialog());
    this.subscriptions.add(this.subscribeToCloseDialog());
  }

  private subscribeToOpenDialog(): Subscription {
    return this.router.events
      .pipe(
        filter(event => !this.open$.getValue() && event instanceof NavigationStart),
        filter((event: NavigationStart) => isDialogPathInUrl(event.url, 'fsdialog'))
      )
      .subscribe(event => this.openDialog());
  }

  private subscribeToCloseDialog(): Subscription {
    return this.router.events
      .pipe(
        filter(event => this.open$.getValue() && event instanceof NavigationStart),
        filter((event: NavigationStart) => !isDialogPathInUrl(event.url, 'fsdialog'))
      )
      .subscribe(event => this.closeDialog());
  }

  private openDialog() {
    this.open$.next(true);
  }

  private closeDialog() {
    this.open$.next(false);
    this.clearDialogRoute();
  }

  private clearDialogRoute() {
    this.dialogService.closeFullscreenDialog();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:keydown.escape', ['$event'])
  public onKeydownHandler(event: KeyboardEvent) {
    this.closeDialog();
  }
}
