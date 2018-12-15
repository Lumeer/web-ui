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

import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {DialogService} from './dialog.service';

declare let $: any;

@Component({
  selector: 'dialog-base',
  templateUrl: './dialog-base.component.html',
})
export class DialogBaseComponent implements OnInit, OnDestroy, AfterViewInit {
  public id = 'dialog';

  public open: boolean;

  public modalDialogClass: string = '';

  private subscriptions = new Subscription();

  public constructor(private dialogService: DialogService, private router: Router, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeToOpenDialog());
    this.subscriptions.add(this.subscribeToActivatedRoute());
    this.subscriptions.add(this.subscribeToCloseDialog());
  }

  private subscribeToOpenDialog(): Subscription {
    return this.router.events
      .pipe(
        filter(event => !this.open && event instanceof NavigationStart),
        filter((event: NavigationStart) => event.url.includes('(dialog:'))
      )
      .subscribe(event => this.openDialog());
  }

  private subscribeToActivatedRoute(): Subscription {
    return this.route.data.subscribe(data => {
      this.modalDialogClass = data.modalDialogClass ? data.modalDialogClass : '';
    });
  }

  private subscribeToCloseDialog(): Subscription {
    return this.router.events
      .pipe(
        filter(event => this.open && event instanceof NavigationStart),
        filter((event: NavigationStart) => !event.url.includes('(dialog:'))
      )
      .subscribe(event => this.closeDialog());
  }

  private openDialog() {
    this.open = true;
    this.dialog().modal('show');
  }

  private closeDialog() {
    this.open = false;
    this.dialog().modal('hide');
  }

  public ngAfterViewInit() {
    this.dialog().on('hidden.bs.modal', () => {
      this.open = false;
      this.clearDialogRoute();
    });
  }

  private clearDialogRoute() {
    this.dialogService.closeDialog();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private dialog(): any {
    return $(`#${this.id}`);
  }
}
