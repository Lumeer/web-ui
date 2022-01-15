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
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  MapCoordinates,
  MapImageData,
  MapMarkerProperties,
  MapPosition,
} from '../../../../../../core/store/maps/map.model';
import {BehaviorSubject, fromEvent, Subscription} from 'rxjs';
import {Rectangle} from './map-image-render-utils';
import {ResizeObserver} from '../../../../../../shared/resize-observer';
import {SvgImageMap} from './svg-image-map';

declare let ResizeObserver: ResizeObserver;

@Component({
  selector: 'map-image-render',
  templateUrl: './map-image-render.component.html',
  styleUrls: ['./map-image-render.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex flex-column w-100 h-100 position-relative'},
})
export class MapImageRenderComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public position: MapPosition;

  @Input()
  public data: MapImageData;

  @Input()
  public markers: MapMarkerProperties[];

  @Output()
  public detail = new EventEmitter<MapMarkerProperties>();

  @Output()
  public markerMove = new EventEmitter<{marker: MapMarkerProperties; x: number; y: number}>();

  @Output()
  public mapMove = new EventEmitter<MapPosition>();

  @Output()
  public newMarker = new EventEmitter<{x: number; y: number}>();

  @ViewChild('svgWrapper')
  set content(content: ElementRef<SVGElement>) {
    if (content) {
      this.initSvgImageMap(content.nativeElement);
    }
  }

  public size$: BehaviorSubject<{width: number; height: number}>;

  private svgImageMap: SvgImageMap;
  private resizeObserver: ResizeObserver;
  private subscriptions = new Subscription();

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    this.size$ = new BehaviorSubject(this.getElementSize());

    this.initResizeListener();
  }

  private initResizeListener() {
    if (window['ResizeObserver']) {
      this.resizeObserver = new ResizeObserver(() => this.refreshSize());
      this.resizeObserver.observe(this.element.nativeElement);
    } else {
      const subscription = fromEvent(window, 'resize').subscribe(() => this.refreshSize());
      this.subscriptions.add(subscription);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.data && this.data) {
      this.svgImageMap?.setData(this.data);
    }
    if (changes.markers && this.markers) {
      this.svgImageMap?.setMarkers(this.markers);
    }
    if (changes.position && this.position) {
      this.svgImageMap?.setPosition(this.position);
    }
  }

  private initSvgImageMap(content: SVGElement) {
    this.svgImageMap = new SvgImageMap(this.element, content, this.data, this.position, this.markers);
    this.subscriptions.add(this.svgImageMap.detail$.subscribe(event => this.detail.emit(event)));
    this.subscriptions.add(this.svgImageMap.mapMove$.subscribe(event => this.mapMove.emit(event)));
    this.subscriptions.add(this.svgImageMap.markerMove$.subscribe(event => this.markerMove.emit(event)));
    this.subscriptions.add(this.svgImageMap.markerCreate$.subscribe(event => this.newMarker.emit(event)));
  }

  public zoomIn() {
    this.svgImageMap?.zoomIn();
  }

  public zoomOut() {
    this.svgImageMap?.zoomOut();
  }

  public resetZoom() {
    this.svgImageMap?.resetZoom();
  }

  private refreshSize() {
    this.size$.next(this.getElementSize());
    this.svgImageMap?.onResize();
  }

  private getElementSize(): Rectangle {
    const {offsetWidth, offsetHeight} = this.element.nativeElement;
    return {width: offsetWidth, height: offsetHeight};
  }

  public ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.subscriptions.unsubscribe();
    this.svgImageMap?.destroy();
  }
}
