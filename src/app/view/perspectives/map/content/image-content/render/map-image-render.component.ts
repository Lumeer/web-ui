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
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {MapImageData, MapMarkerProperties} from '../../../../../../core/store/maps/map.model';
import {BehaviorSubject, Observable} from 'rxjs';
import {MimeType} from '../../../../../../core/model/mime-type';
import {
  addMarkerToSvgContainer,
  computeMarkerPosition,
  Rectangle,
  SVGContainer,
  Position,
  checkDragBounds,
} from './map-image-render-utils';
import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';

@Component({
  selector: 'map-image-render',
  templateUrl: './map-image-render.component.html',
  styleUrls: ['./map-image-render.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block w-100 h-100 position-relative'},
})
export class MapImageRenderComponent implements OnInit, OnChanges {
  @Input()
  public data: MapImageData;

  @Input()
  public markers: MapMarkerProperties[];

  @Output()
  public detail = new EventEmitter<MapMarkerProperties>();

  @ViewChild('svgWrapper')
  set content(content: ElementRef<SVGElement>) {
    if (content) {
      this.svgWrapper = content.nativeElement;
      this.checkMimeTypeImage();
    }
  }

  private svgWrapper: SVGElement;
  private svgImage: SVGElement;
  private svgImageWrapper: SVGElement;
  private svgMarkersWrapper: SVGElement;
  private currentMimeType: MimeType = null;
  private zoom: d3Zoom.ZoomBehavior<Element, any>;

  public size$: Observable<{width: number; height: number}>;
  private sizeSubject$: BehaviorSubject<{width: number; height: number}>;

  constructor(private element: ElementRef) {}

  public ngOnInit() {
    this.sizeSubject$ = new BehaviorSubject(this.getElementSize());
    this.size$ = this.sizeSubject$.asObservable();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.data) {
      this.checkMimeTypeImage();
    }
    if (changes.markers && this.svgMarkersWrapper) {
      this.drawMarkers();
    }
  }

  private drawMarkers() {
    let deltaX, deltaY;

    const svgImageContainer = d3Select.select(this.svgImageWrapper);
    const center = this.getElementSize();
    const bounds = this.getElementBounds();
    const drag = d3Drag
      .drag()
      .on('start', function () {
        const current = d3Select.select(this);
        deltaX = +current.attr('x') - d3Select.event.x;
        deltaY = +current.attr('y') - d3Select.event.y;
      })
      .on('drag', function () {
        const scale = +(svgImageContainer.attr('scale') || 1);

        const {x, y} = checkDragBounds(
          {
            x: d3Select.event.x + deltaX,
            y: d3Select.event.y + deltaY,
          },
          scale,
          center,
          bounds
        );

        const element = d3Select.select(this);
        const width = +element.attr('width');
        const height = +element.attr('height');

        element
          .attr('x', x)
          .attr('y', y)
          .attr('initial-x', x / scale - (width * (scale - 1)) / (2 * scale))
          .attr('initial-y', y / scale - (height * (scale - 1)) / scale);
      });

    const svgMarkersContainer = d3Select.select(this.svgMarkersWrapper);
    const imageScale = +(svgImageContainer.attr('scale') || 1);
    const drawnIds = new Set();
    for (const marker of this.markers || []) {
      const {x, y} = computeMarkerPosition(markerPosition(marker), imageScale, center, bounds);
      const selectedMarker = svgMarkersContainer.select(`svg[id='${marker.id}']`);
      if (selectedMarker.empty()) {
        addMarkerToSvgContainer(svgMarkersContainer, marker, imageScale, x, y)
          .call(drag)
          .on('dblclick', () => {
            d3Select.event.stopPropagation();
            this.detail.emit(marker);
          });
      } else if (+selectedMarker.attr('x') !== x || +selectedMarker.attr('y') !== y) {
        selectedMarker
          .attr('x', x)
          .attr('initial-x', x / imageScale)
          .attr('y', y)
          .attr('initial-y', y / imageScale);
      }
      drawnIds.add(marker.id);
    }

    svgMarkersContainer
      .selectAll<SVGElement, any>('svg')
      .filter(function () {
        return !drawnIds.has(this.getAttribute('id'));
      })
      .remove();
  }

  public checkMimeTypeImage() {
    if (!this.svgWrapper || !this.data || this.currentMimeType === this.data.mimeType) {
      return;
    }

    if (this.data.mimeType === MimeType.Svg) {
      this.svgImageWrapper = this.initSvgImage();
    } else {
      this.svgImageWrapper = this.initOtherImage();
    }

    this.clearMarkers(true);
    this.svgMarkersWrapper = this.createSvgWrapper();

    this.initZoom(
      d3Select.select(this.svgWrapper),
      d3Select.select(this.svgImageWrapper),
      d3Select.select(this.svgMarkersWrapper)
    );
    this.drawMarkers();

    this.currentMimeType = this.data.mimeType;
  }

  private clearMarkers(removeParent?: boolean) {
    if (this.svgMarkersWrapper) {
      const svgMarkersContainer = d3Select.select(this.svgMarkersWrapper);
      svgMarkersContainer.selectAll(':scope > svg').remove();
      if (removeParent) {
        svgMarkersContainer.remove();
      }
    }
  }

  private initSvgImage(): SVGElement {
    this.removeSvgImage();

    const document = new DOMParser().parseFromString(this.data.data, 'image/svg+xml');
    this.svgImage = document.childNodes.item(0) as SVGElement;
    this.svgImage.setAttribute('width', this.element.nativeElement.offsetWidth);
    this.svgImage.setAttribute('height', this.element.nativeElement.offsetHeight);

    return this.createSvgWrapper(this.svgImage);
  }

  private removeSvgImage() {
    if (this.svgImage) {
      this.svgWrapper.removeChild(this.svgImage.parentNode);
      this.svgImage = null;
    }
  }

  private createSvgWrapper(element?: SVGElement): SVGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (element) {
      group.appendChild(element);
    }
    this.svgWrapper.appendChild(group);
    return group;
  }

  private initOtherImage(): SVGElement {
    this.removeSvgImage();

    this.svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    this.svgImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.data.data);
    this.svgImage.setAttribute('style', 'width: 100%; height: 100%');

    return this.createSvgWrapper(this.svgImage);
  }

  private initZoom(selection: SVGContainer, svgImageWrapper: SVGContainer, svgMarkersWrapper: SVGContainer) {
    selection.on('.zoom', null);

    this.zoom = d3Zoom
      .zoom()
      .filter(() => {
        if (d3Select.event.type === 'wheel') {
          return true;
        }
        return !d3Select.event.ctrlKey && !d3Select.event.button;
      })
      .extent([
        [0, 0],
        [this.getElementSize().width, this.getElementSize().height],
      ])
      .scaleExtent([0.5, 20])
      .on('zoom', () => {
        const transform = d3Select.event.transform;
        svgImageWrapper.attr('transform', transform).attr('scale', transform.k);
        svgMarkersWrapper.attr('transform', `translate(${transform.x},${transform.y})`);
        svgMarkersWrapper
          .selectAll('svg')
          .attr('x', function () {
            const element = d3Select.select(this);
            return +element.attr('initial-x') * transform.k + (+element.attr('width') * (transform.k - 1)) / 2;
          })
          .attr('y', function () {
            const element = d3Select.select(this);
            return +element.attr('initial-y') * transform.k + +element.attr('height') * (transform.k - 1);
          });
      });

    selection.call(this.zoom);
  }

  public zoomIn() {
    if (this.zoom) {
      this.svgTransition(500)?.call(this.zoom.scaleBy, 2);
    }
  }

  public zoomOut() {
    if (this.zoom) {
      this.svgTransition(500)?.call(this.zoom.scaleBy, 0.5);
    }
  }

  public resetZoom() {
    if (this.zoom) {
      this.svgTransition(750)?.call(this.zoom.transform, d3Zoom.zoomIdentity);
    }
  }

  private svgTransition(duration: number): SVGContainer {
    if (this.svgWrapper) {
      return d3Select.select(this.svgWrapper)?.['transition']()?.duration(duration);
    }
    return null;
  }

  @HostListener('window:resize')
  public onResize() {
    this.refreshSize();
  }

  private refreshSize() {
    const elementSize = this.getElementSize();
    this.sizeSubject$.next(elementSize);
    if (this.svgImage) {
      this.svgImage.setAttribute('width', String(elementSize.width));
      this.svgImage.setAttribute('height', String(elementSize.height));

      const bounds = this.getElementBounds();
      const svgImageContainer = d3Select.select(this.svgImageWrapper);
      const scale = +(svgImageContainer.attr('scale') || 1);
      for (const marker of this.markers || []) {
        const {x, y} = computeMarkerPosition(markerPosition(marker), scale, elementSize, bounds);
        d3Select
          .select(`svg[id='${marker.id}']`)
          .attr('x', x)
          .attr('initial-x', x / scale)
          .attr('y', y)
          .attr('initial-y', y / scale);
      }
    }
  }

  private getElementSize(): Rectangle {
    const {offsetWidth, offsetHeight} = this.element.nativeElement;
    return {width: offsetWidth, height: offsetHeight};
  }

  private getElementBounds(): Rectangle {
    const {width, height} = this.getElementSize();
    const scale = Math.max(this.data.width / width, this.data.height / height);
    return {width: this.data.width / scale, height: this.data.height / scale};
  }

  public refreshMap() {
    this.refreshSize();
  }
}

function markerPosition(marker: MapMarkerProperties): Position {
  return {x: marker.coordinates.lng, y: marker.coordinates.lat};
}
