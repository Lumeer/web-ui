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
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {MapImageData} from '../../../../../../core/store/maps/map.model';
import {BehaviorSubject, Observable} from 'rxjs';
import {MimeType} from '../../../../../../core/model/mime-type';
import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';

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

  @ViewChild('svgWrapper')
  set content(content: ElementRef<SVGElement>) {
    if (content) {
      this.svgWrapper = content.nativeElement;
      this.checkMimeTypeImage();
    }
  }

  private svgWrapper: SVGElement;
  private svgImage: SVGElement;
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
  }

  public checkMimeTypeImage() {
    if (!this.svgWrapper || !this.data || this.currentMimeType === this.data.mimeType) {
      return;
    }

    if (this.data.mimeType === MimeType.Svg) {
      this.initSvgImage();
    } else {
      this.initOtherImage();
    }

    this.currentMimeType = this.data.mimeType;
  }

  private initSvgImage() {
    this.removeSvgImage();

    const document = new DOMParser().parseFromString(this.data.data, 'image/svg+xml');
    this.svgImage = document.childNodes.item(0) as SVGElement;
    this.svgImage.setAttribute('width', this.element.nativeElement.offsetWidth);
    this.svgImage.setAttribute('height', this.element.nativeElement.offsetHeight);

    this.addSvgImage(this.svgImage);
  }

  private removeSvgImage() {
    if (this.svgImage) {
      this.svgWrapper.removeChild(this.svgImage.parentNode);
      this.svgImage = null;
    }
  }

  private addSvgImage(element: SVGElement) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.appendChild(element);
    this.svgWrapper.appendChild(group);

    this.initZoom(d3Select.select(this.svgWrapper), d3Select.select(group));
  }

  private initOtherImage() {
    this.removeSvgImage();

    this.svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    this.svgImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.data.data);
    this.svgImage.setAttribute('style', 'width: 100%; height: 100%');

    this.addSvgImage(this.svgImage);
  }

  private initZoom(selection: any, element: any) {
    selection.on('.zoom', null);

    this.zoom = d3Zoom
      .zoom()
      .filter(() => true)
      .extent([
        [0, 0],
        [this.getElementSize().width, this.getElementSize().height],
      ])
      .scaleExtent([1, 20])
      .on('zoom', () => element.attr('transform', d3Select.event.transform));

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

  private svgTransition(duration: number): any {
    if (this.svgWrapper) {
      return d3Select.select(this.svgWrapper)['transition']().duration(duration);
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
    }
  }

  private getElementSize(): {width: number; height: number} {
    const {offsetWidth, offsetHeight} = this.element.nativeElement;
    return {width: offsetWidth, height: offsetHeight};
  }

  public refreshMap() {
    this.refreshSize();
  }
}
