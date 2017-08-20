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

import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

import {Collection} from '../../../../../core/dto/collection';
import {Attribute} from '../../../../../core/dto/attribute';
import {AttributePropertyInput} from './document/attribute-list/attribute-property-input';
import {LayoutOptions} from './layout-options';
import {isUndefined} from 'util';

@Component({
  selector: 'post-it-document-layout',
  templateUrl: './post-it-document-layout.component.html',
  styleUrls: ['./post-it-document-layout.component.scss'],
  animations: [
    trigger('appear', [
      transition(':enter', [
        style({transform: 'scale(0)'}),
        animate('0.25s ease-out', style({transform: 'scale(1)'}))
      ]),
      transition(':leave', [
        style({transform: 'scale(1)'}),
        animate('0.25s ease-out', style({transform: 'scale(0)'}))
      ])
    ])
  ]
})
export class PostItDocumentLayoutComponent implements OnInit, OnDestroy {

  @Input()
  public editable: boolean;

  @Input()
  public collection: Collection;

  @Input()
  public attributes: Attribute[];

  @Input()
  public documents: Document[];

  @Input()
  public selectedInput: AttributePropertyInput;

  @Input()
  public options: LayoutOptions = {};

  @Output()
  public newDocument = new EventEmitter();

  @Output()
  public removed = new EventEmitter<number>();

  @Output()
  public attributePairChange = new EventEmitter();

  private layout: any;

  private refreshing: boolean;

  constructor(private element: ElementRef) {
  }

  public ngOnInit(): void {
    this.initializeLayout();
  }

  public ngOnDestroy(): void {
    this.destroyLayout();
  }

  private initializeLayout(): void {
    let Masonry = window['Masonry'];
    this.layout = new Masonry(this.element.nativeElement, this.options);
  }

  private destroyLayout(): void {
    this.layout.destroy();
    this.refresh();
  }

  public stampElement(element: HTMLElement): void {
    this.layout.stamp(element);
    this.refresh();
  }

  public addElement(element: HTMLElement): void {
    let index = +(element.getAttribute('index'));

    if (!isUndefined(index) && index > 0) {
      this.layout.appended(element);
    } else {
      this.layout.prepended(element);
    }

    this.refresh();
  }

  public removeElement(element: HTMLElement): void {
    this.layout.remove(element);
    this.refresh();
  }

  public reloadItems(): void {
    this.layout.reloadItems();
    this.refresh();
  }

  public refresh(forced?: boolean): void {
    if (!this.refreshing || forced) {
      this.refreshing = true;

      setTimeout(() => {
        this.refreshing = false;
        this.layout.layout();
      }, 500);
    }
  }

}
