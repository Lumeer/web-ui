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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DataInputConfiguration} from '../../data-input/data-input-configuration';
import {Constraint, ConstraintData} from '@lumeer/data-filters';
import {AttributesSettings, View} from '../../../core/store/views/view';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {getAttributesResourceType} from '../../utils/resource.utils';
import {clickedInsideElement, shadeColor} from '../../utils/html-modifier';
import {filterVisibleAttributesBySettings} from '../../utils/attribute.utils';
import {getDefaultAttributeId} from '../../../core/store/collections/collection.util';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {CdkScrollable, ScrollDispatcher} from '@angular/cdk/overlay';
import {CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {KeyCode} from '../../key-code';

const ROW_HEIGHT = 32;
const COLUMN_WIDTH = 120;

@Component({
  selector: 'preview-results-table',
  templateUrl: './preview-results-table.component.html',
  styleUrls: ['./preview-results-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewResultsTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public dataResources: DataResource[];

  @Input()
  public resource: AttributesResource;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selectedId: string;

  @Input()
  public loaded: boolean;

  @Input()
  public attributesSettings: AttributesSettings;

  @Input()
  public view: View;

  @Input()
  public resizeable = true;

  @Input()
  public tableHeight: number;

  @Output()
  public detailDataResource = new EventEmitter<DataResource>();

  @Output()
  public selectDataResource = new EventEmitter<DataResource>();

  @ViewChild(CdkVirtualScrollViewport, {static: false})
  public viewPort: CdkVirtualScrollViewport;

  @Output()
  public tableHeightChange = new EventEmitter<number>();

  public readonly configuration: DataInputConfiguration = {
    common: {inline: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };
  public readonly rowHeight = ROW_HEIGHT;

  public hasFocus = true;
  public columns: PreviewResultsColumn[];
  public hasData: boolean;
  public scrolledIndex$: Observable<number>;
  public numVisibleRows$ = new BehaviorSubject(0);
  public columnWidth$ = new BehaviorSubject<number>(null);

  private scrolledIndex: number;
  private subscriptions = new Subscription();

  constructor(private scrollDispatcher: ScrollDispatcher, private element: ElementRef) {}

  public ngOnInit() {
    this.subscriptions.add(this.subscribeHorizontalScrolling());
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource || changes.attributesSettings) {
      this.createColumns();
      this.checkColumnWidth();
    }
    if (changes.dataResources && changes.selectedId && this.dataResources && this.selectedId) {
      setTimeout(() => this.scrollToCurrentRow());
    }
    if (changes.dataResources) {
      this.hasData = (this.dataResources || []).length > 0;
    }
    if (changes.tableHeight || changes.dataResources) {
      setTimeout(() => {
        this.viewPort?.checkViewportSize();
        this.checkNumVisibleRows();
      });
    }
  }

  private createColumns() {
    const color = this.createColor();
    const attributes = filterVisibleAttributesBySettings(this.resource, this.attributesSettings?.collections);
    const defaultAttributeId =
      getAttributesResourceType(this.resource) === AttributesResourceType.Collection
        ? getDefaultAttributeId(this.resource)
        : null;

    this.columns = attributes.map(attribute => ({
      id: attribute.id,
      name: attribute.name,
      color,
      width: COLUMN_WIDTH,
      constraint: attribute.constraint,
      bold: attribute.id === defaultAttributeId,
    }));
  }

  private createColor(): string {
    if (getAttributesResourceType(this.resource) === AttributesResourceType.Collection) {
      const color = (<Collection>this.resource)?.color;
      return shadeColor(color, 0.5);
    }
    return 'white';
  }

  private subscribeHorizontalScrolling(): Subscription {
    return this.scrollDispatcher
      .scrolled()
      .pipe(filter(scrollable => !!scrollable && this.isScrollableInsideComponent(scrollable)))
      .subscribe((scrollable: CdkScrollable) => {
        const left = scrollable.measureScrollOffset('left');

        Array.from(this.scrollDispatcher.scrollContainers.keys())
          .filter(
            otherScrollable =>
              otherScrollable !== scrollable &&
              this.isScrollableInsideComponent(otherScrollable) &&
              otherScrollable.measureScrollOffset('left') !== left
          )
          .forEach(otherScrollable => otherScrollable.scrollTo({left}));
      });
  }

  private isScrollableInsideComponent(scrollable: CdkScrollable): boolean {
    return this.element.nativeElement.contains(scrollable.getElementRef().nativeElement);
  }

  public activate(dataResource: DataResource) {
    this.selectDataResource.emit(dataResource);
  }

  public detail(dataResource: DataResource) {
    this.detailDataResource.emit(dataResource);
  }

  public trackByAttribute(index: number, column: PreviewResultsColumn): string {
    return column.id;
  }

  public trackByDataResource(index: number, dataResource: DataResource): string {
    return dataResource.correlationId || dataResource.id;
  }

  public ngAfterViewInit() {
    this.scrollToCurrentRow();

    this.scrolledIndex$ = this.viewPort.elementScrolled().pipe(
      map(() => this.viewPort.measureScrollOffset('top') / ROW_HEIGHT),
      tap(scrolledIndex => (this.scrolledIndex = scrolledIndex))
    );
    this.viewPort.checkViewportSize();
    if (this.tableHeight) {
      this.checkNumVisibleRows();
    } else {
      this.checkNumVisibleRowsAfterDelay();
    }
    this.checkColumnWidth();
  }

  public checkColumnWidth() {
    const elementWidth = this.viewPort?.elementRef?.nativeElement?.clientWidth || 0;
    const columns = this.columns?.length || 0;
    if (elementWidth && columns) {
      this.columnWidth$.next(Math.max(COLUMN_WIDTH, elementWidth / columns));
    }
  }

  private checkNumVisibleRowsAfterDelay() {
    setTimeout(() => this.checkNumVisibleRows());
  }

  private scrollToCurrentRow() {
    if (this.selectedId) {
      const index = (this.dataResources || []).findIndex(
        dataResource => this.selectedId === (dataResource.id || dataResource.correlationId)
      );
      if (index >= 0 && !this.isIndexVisible(index)) {
        this.viewPort?.scrollToIndex(index, 'smooth');
      }
    }
  }

  private isIndexVisible(index: number): boolean {
    const fromIndex = Math.floor(this.scrolledIndex);
    const to = Math.ceil(this.scrolledIndex + this.numVisibleRows$.value);
    return fromIndex <= index && to > index;
  }

  @HostListener('window:resize')
  public onWindowResize() {
    this.checkColumnWidth();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onTableResize(viewport: CdkVirtualScrollViewport, height: number) {
    viewport.checkViewportSize();
    this.checkNumVisibleRows();

    this.tableHeightChange.emit(height);
  }

  private checkNumVisibleRows() {
    if (this.viewPort) {
      this.numVisibleRows$.next(this.viewPort.getViewportSize() / ROW_HEIGHT - 1);
    }
  }

  @HostListener('document:click', ['$event'])
  public onClick(event: MouseEvent) {
    this.hasFocus = clickedInsideElement(event, this.element.nativeElement.tagName);
  }

  @HostListener('document:keydown', ['$event'])
  public onKeydown(event: KeyboardEvent) {
    if (!this.hasFocus) {
      return;
    }
    if (event.code === KeyCode.ArrowUp) {
      const index = (this.dataResources || []).findIndex(dataResource => dataResource.id === this.selectedId);
      this.activeByIndex(index - 1);
    } else if (event.code === KeyCode.ArrowDown) {
      const index = (this.dataResources || []).findIndex(dataResource => dataResource.id === this.selectedId);
      this.activeByIndex(index + 1);
    }
  }

  private activeByIndex(index: number) {
    if (index >= 0 && index < (this.dataResources || []).length) {
      this.activate(this.dataResources[index]);
    }
  }
}

export interface PreviewResultsColumn {
  id: string;
  constraint: Constraint;
  width: number;
  name: string;
  color: string;
  bold?: boolean;
}
