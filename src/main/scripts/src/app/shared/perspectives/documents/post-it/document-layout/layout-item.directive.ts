/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {AfterViewInit, Directive, ElementRef, Host, Input, OnDestroy} from '@angular/core';

import {PostItDocumentLayoutComponent} from './post-it-document-layout.component';

@Directive({
  selector: '[layout-item]'
})
export class LayoutItemDirective implements AfterViewInit, OnDestroy {

  @Input()
  public stamp: boolean;

  @Input()
  public refreshOnChildChanges: boolean;

  constructor(@Host()
              private parentElement: PostItDocumentLayoutComponent,
              private element: ElementRef) {
  }

  public ngAfterViewInit(): void {
    this.parentElement.addElement(this.element.nativeElement);

    if (this.stamp) {
      this.parentElement.stampElement(this.element.nativeElement);
    }

    if (this.refreshOnChildChanges) {
      this.watchChildChanges();
    }
  }

  public ngOnDestroy(): void {
    this.parentElement.removeElement(this.element.nativeElement);
  }

  private watchChildChanges(): void {
    MutationObserver = window['MutationObserver'] || window['WebKitMutationObserver'];

    let observer = new MutationObserver(() => this.parentElement.refresh());

    observer.observe(this.element.nativeElement, {
      subtree: true,
      childList: true
    });
  }

}
