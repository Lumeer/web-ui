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

import {MapImageData, MapMarkerProperties, MapPosition} from '../../../../../../core/store/maps/map.model';
import * as d3Select from 'd3-selection';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';
import {
  addMarkerToSvgContainer,
  computeMarkerCoordinates,
  computeMarkerInitialX,
  computeMarkerInitialY,
  computeMarkerPosition,
  defaultMarkerSize,
  Position,
  Rectangle,
  scaleImagePoint,
  SVGContainer,
} from './map-image-render-utils';
import {deepObjectsEquals, isNotNullOrUndefined, objectValues} from '../../../../../../shared/utils/common.utils';
import {MimeType} from '../../../../../../core/model/mime-type';
import {ElementRef, EventEmitter} from '@angular/core';
import {deepArrayEquals} from '../../../../../../shared/utils/array.utils';

export class SvgImageMap {
  public detail$ = new EventEmitter<MapMarkerProperties>();
  public markerMove$ = new EventEmitter<{marker: MapMarkerProperties; x: number; y: number}>();
  public mapMove$ = new EventEmitter<MapPosition>();
  public markerCreate$ = new EventEmitter<{x: number; y: number}>();

  private svgImage: SVGElement;
  private svgImageWrapper: SVGElement;
  private svgMarkersWrapper: SVGElement;
  private zoom: d3Zoom.ZoomBehavior<Element, any>;
  private mapDragging: boolean;
  private popupWrapper: HTMLElement;
  private menuWrapper: HTMLElement;

  private currentPosition: MapPosition;
  private currentData: MapImageData;
  private markers: Record<string, MapMarkerProperties> = {};
  private menuListeners: Record<number, EventListenerOrEventListenerObject> = {};

  constructor(
    private element: ElementRef,
    private svgWrapper: SVGElement,
    data: MapImageData,
    position: MapPosition,
    markers: MapMarkerProperties[]
  ) {
    this.currentData = data;
    this.currentPosition = position;
    this.initImage(markers);
  }

  public setData(data: MapImageData) {
    if (!this.dataChanged(data)) {
      return;
    }
    this.currentData = data;
    this.initImage(objectValues(this.markers));
  }

  private initImage(markers: MapMarkerProperties[]) {
    if (this.currentData.mimeType === MimeType.Svg) {
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
    this.initMenu();
    this.drawMarkers(markers);
  }

  public setMarkers(markers: MapMarkerProperties[]) {
    this.drawMarkers(markers);
  }

  private drawMarkers(markers: MapMarkerProperties[]) {
    let deltaX, deltaY;

    const _this = this;
    const drag = d3Drag
      .drag()
      .on('start', function (this, event) {
        const current = d3Select.select(this);
        deltaX = +current.attr('x') - event.x;
        deltaY = +current.attr('y') - event.y;
      })
      .on('drag', function (this, event) {
        _this.hideMarkerPopup();
        const elementCenter = _this.getElementSize();
        const imageBounds = _this.computeImageRectangle();
        const {scale: dragScale, pixelScale: dragPixelScale} = _this.getCurrentTranslate();

        const {x, y} = computeMarkerPosition(
          computeMarkerCoordinates(
            {
              x: event.x + deltaX,
              y: event.y + deltaY,
            },
            dragScale,
            dragPixelScale,
            elementCenter
          ),
          dragScale,
          dragPixelScale,
          elementCenter,
          imageBounds
        );

        const element = d3Select.select(this);
        const width = +element.attr('width');
        const height = +element.attr('height');

        element
          .attr('x', scaleImagePoint(x))
          .attr('y', scaleImagePoint(y))
          .attr('initial-x', scaleImagePoint(x / dragScale - (width * (dragScale - 1)) / (2 * dragScale)))
          .attr('initial-y', scaleImagePoint(y / dragScale - (height * (dragScale - 1)) / dragScale));
      })
      .on('end', function () {
        const dragCenter = _this.getElementSize();
        const {scale: dragScale, pixelScale: dragPixelScale} = _this.getCurrentTranslate();

        const element = d3Select.select(this);
        const position = {x: +element.attr('x'), y: +element.attr('y')};

        const {x, y} = computeMarkerCoordinates(position, dragScale, dragPixelScale, dragCenter);
        _this.onMarkerMove(element.attr('id'), x, y);
      });

    const svgMarkersContainer = d3Select.select(this.svgMarkersWrapper);
    const center = this.getElementSize();
    const bounds = this.computeImageRectangle();
    const {scale, pixelScale} = this.getCurrentTranslate();
    const drawnIds = new Set();
    const markersMap = {};
    for (const marker of markers) {
      const {x, y} = computeMarkerPosition(markerPosition(marker), scale, pixelScale, center, bounds);
      let selectedMarker = this.findMarkerContainer(marker);
      if (selectedMarker.empty() || this.mapMarkerPropertiesChanged(marker)) {
        if (!selectedMarker.empty()) {
          selectedMarker.remove();
        }
        selectedMarker = addMarkerToSvgContainer(svgMarkersContainer, marker, scale, x, y)
          .on('dblclick', event => {
            event.stopPropagation();
            this.detail$.emit(marker);
          })
          .on('mouseenter', () => this.showMarkerPopup(marker))
          .on('mouseleave', () => this.hideMarkerPopup());
      } else if (this.mapMarkerPositionChanged(selectedMarker, x, y)) {
        selectedMarker
          .attr('x', scaleImagePoint(x))
          .attr('initial-x', scaleImagePoint(computeMarkerInitialX(x, scale, +selectedMarker.attr('width'))))
          .attr('y', scaleImagePoint(y))
          .attr('initial-y', scaleImagePoint(computeMarkerInitialY(y, scale, +selectedMarker.attr('height'))));
      }
      markersMap[marker.id] = marker;

      if (marker.editable) {
        selectedMarker.call(drag);
      } else {
        selectedMarker.on('.drag', null);
      }
      drawnIds.add(marker.id);
    }
    this.markers = markersMap;

    svgMarkersContainer
      .selectAll<SVGElement, any>('svg')
      .filter(function () {
        return !drawnIds.has(this.getAttribute('id'));
      })
      .remove();
  }

  private showMarkerPopup(marker: MapMarkerProperties) {
    this.hideMarkerPopup();

    const html = marker.displayValue
      ? `<div>${marker.displayValue}</div>${marker.positionValue}`
      : marker.positionValue;

    const markerContainer = this.findMarkerContainer(marker);
    const translate = this.getCurrentTranslate();

    const popupWrapper = document.createElement('div');
    popupWrapper.classList.add('popup-wrapper');
    popupWrapper.innerHTML = html;
    popupWrapper.style.top = `${+markerContainer.attr('y') + translate.y + +markerContainer.attr('height') + 10}px`;
    popupWrapper.style.left = `${+markerContainer.attr('x') + translate.x + +markerContainer.attr('width') / 2}px`;
    this.element.nativeElement.appendChild(popupWrapper);

    this.popupWrapper = popupWrapper;
  }

  private hideMarkerPopup() {
    this.popupWrapper?.parentNode?.removeChild(this.popupWrapper);
  }

  private initMenu() {
    this.hideMenu();

    const title = $localize`:@@map.popup.title.create:Create Record`;
    const html = `<div class="popup-content"><div class="dropdown-item cursor-pointer user-select-none border-radius-small">${title}</div></div>`;

    this.menuWrapper = document.createElement('div');
    this.menuWrapper.classList.add('popup-wrapper', 'p-0');
    this.menuWrapper.innerHTML = html;

    this.svgWrapper.addEventListener('contextmenu', event => {
      const rectangle = this.computeImageRectangle();
      const translate = this.getCurrentTranslate();
      const rectangleX = rectangle.x * translate.scale + translate.x;
      const rectangleY = rectangle.y * translate.scale + translate.y;
      const x = event.offsetX;
      const y = event.offsetY;
      const width = rectangle.width * translate.scale;
      const height = rectangle.height * translate.scale;

      if (x >= rectangleX && x <= rectangleX + width && y >= rectangleY && y <= rectangleY + height) {
        event.preventDefault();

        const positionX = x - translate.x - defaultMarkerSize.width / 2;
        const positionY = y - translate.y - defaultMarkerSize.height;
        const coordinates = computeMarkerCoordinates(
          {x: positionX, y: positionY},
          translate.scale,
          translate.pixelScale,
          this.getElementSize()
        );

        this.addMenu(event, coordinates.x, coordinates.y);
      }
    });

    this.element.nativeElement.addEventListener('click', () => this.hideMenu());
  }

  private addMenu(event: MouseEvent, mapX: number, mapY: number) {
    this.menuWrapper.style.top = `${event.offsetY + 10}px`; // 10px offset for arrow
    this.menuWrapper.style.left = `${event.offsetX}px`;

    this.element.nativeElement.appendChild(this.menuWrapper);

    const clickableElements = this.menuWrapper?.getElementsByClassName('dropdown-item');
    if (clickableElements?.length) {
      this.menuListeners[0] = () => {
        this.hideMenu();
        this.markerCreate$.next({x: mapX, y: mapY});
      };
      clickableElements.item(0).addEventListener('click', this.menuListeners[0]);
    }
  }

  private hideMenu() {
    const clickableElements = this.menuWrapper?.getElementsByClassName('dropdown-item');
    for (let i = 0; i < clickableElements?.length; i++) {
      clickableElements.item(0).removeEventListener('click', this.menuListeners[i]);
    }

    this.menuWrapper?.parentNode?.removeChild(this.menuWrapper);
  }

  private mapMarkerPositionChanged(container: SVGContainer, newX: number, newY: number): boolean {
    return +container.attr('x') !== scaleImagePoint(newX) || +container.attr('y') !== scaleImagePoint(newY);
  }

  private mapMarkerPropertiesChanged(marker: MapMarkerProperties): boolean {
    const currentMarker = this.markers[marker.id];
    return (
      currentMarker?.color !== marker.color ||
      !deepArrayEquals(currentMarker?.icons, marker.icons) ||
      currentMarker?.displayValue !== marker.displayValue
    );
  }

  private onMarkerMove(id: string, x: number, y: number) {
    const marker = this.markers?.[id];
    if (marker) {
      this.markerMove$.emit({marker, x, y});
    }
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

    const document = new DOMParser().parseFromString(this.currentData.data, 'image/svg+xml');
    this.svgImage = document.childNodes.item(0) as SVGElement;
    this.setSvgImageRectangle();

    return this.createSvgWrapper(this.svgImage);
  }

  private setSvgImageRectangle() {
    const bounds = this.computeImageRectangle();
    this.svgImage.setAttribute(
      'style',
      `width: ${bounds.width}px; height: ${bounds.height}px; x: ${bounds.x}px; y: ${bounds.y}px`
    );
    this.svgImage.setAttribute('width', String(bounds.width));
    this.svgImage.setAttribute('height', String(bounds.height));
    this.svgImage.setAttribute('x', String(bounds.x));
    this.svgImage.setAttribute('y', String(bounds.y));

    if (this.currentData?.mimeType === MimeType.Svg) {
      this.svgImage.setAttribute('viewBox', `0 0 ${this.currentData.width} ${this.currentData.height}`);
    }
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
    this.svgImage.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', this.currentData.data);
    this.setSvgImageRectangle();

    return this.createSvgWrapper(this.svgImage);
  }

  private initZoom(selection: SVGContainer, svgImageContainer: SVGContainer, svgMarkersContainer: SVGContainer) {
    selection.on('.zoom', null);
    const _this = this;

    this.zoom = d3Zoom
      .zoom()
      .filter(event => {
        if (event.type === 'wheel') {
          return true;
        }
        return !event.ctrlKey && !event.button;
      })
      .extent([
        [0, 0],
        [this.getElementSize().width, this.getElementSize().height],
      ])
      .scaleExtent([0.5, 20])
      .on('start', () => {
        this.mapDragging = true;
      })
      .on('zoom', event => {
        _this.hideMenu();
        const transform = event.transform;
        const x = scaleImagePoint(transform.x);
        const y = scaleImagePoint(transform.y);
        const scale = scaleImagePoint(transform.k);
        svgImageContainer.attr('transform', `translate(${x},${y}) scale(${scale})`);
        svgMarkersContainer.attr('transform', `translate(${x},${y})`);
        svgMarkersContainer
          .selectAll('svg')
          .attr('x', function () {
            const element = d3Select.select(this);
            return scaleImagePoint(
              +element.attr('initial-x') * transform.k + (+element.attr('width') * (transform.k - 1)) / 2
            );
          })
          .attr('y', function () {
            const element = d3Select.select(this);
            return scaleImagePoint(
              +element.attr('initial-y') * transform.k + +element.attr('height') * (transform.k - 1)
            );
          });
      })
      .on('end', event => {
        this.mapDragging = false;

        const transform = event.transform;
        const x = scaleImagePoint(transform.x);
        const y = scaleImagePoint(transform.y);
        const scale = scaleImagePoint(transform.k);

        const position: MapPosition = {...this.currentPosition, zoom: scale, translate: {lng: x, lat: y}};
        this.onMapMove(position);
      });

    selection.call(this.zoom);
    this.setMapTranslate();
  }

  private onMapMove(position: MapPosition) {
    if (!this.currentPosition || !deepObjectsEquals(this.currentPosition, position)) {
      this.mapMove$.emit(position);
    }
  }

  public setPosition(position: MapPosition) {
    if (this.mapDragging) {
      return;
    }

    const {x, y, scale} = this.getCurrentTranslate();
    if (position.translate?.lng !== x || position.translate?.lat !== y || position.zoom !== scale) {
      this.currentPosition = position;
      this.setMapTranslate(true);
    }
  }

  private setMapTranslate(animate: boolean = false) {
    if (!this.currentPosition || !this.zoom) {
      return;
    }
    const translate = this.currentPosition.translate
      ? d3Zoom.zoomIdentity.translate(this.currentPosition.translate.lng, this.currentPosition.translate.lat)
      : null;

    const duration = animate ? 500 : 0;
    if (translate && isNotNullOrUndefined(this.currentPosition.zoom)) {
      this.svgTransition(duration)?.call(this.zoom.transform, translate.scale(this.currentPosition.zoom));
    } else if (translate) {
      this.svgTransition(duration)?.call(this.zoom.transform, translate);
    } else if (isNotNullOrUndefined(this.currentPosition.zoom)) {
      this.svgTransition(duration)?.call(this.zoom.scaleTo, this.currentPosition.zoom);
    }
  }

  public zoomIn() {
    this.svgTransition(500)?.call(this.zoom.scaleBy, 2);
  }

  public zoomOut() {
    this.svgTransition(500)?.call(this.zoom.scaleBy, 0.5);
  }

  public resetZoom() {
    this.svgTransition(750)?.call(this.zoom.transform, d3Zoom.zoomIdentity);
  }

  private svgTransition(duration: number): SVGContainer {
    if (this.svgWrapper) {
      return d3Select.select(this.svgWrapper)?.['transition']()?.duration(duration);
    }
    return null;
  }

  private getCurrentTranslate(): {x: number; y: number; scale: number; pixelScale: number} {
    const svgImageContainer = d3Select.select(this.svgImageWrapper);
    const pixelScale = this.getPixelScale();
    if (!svgImageContainer.empty()) {
      const transform = d3Zoom.zoomTransform(this.svgImageWrapper);
      return {
        x: scaleImagePoint(transform.x),
        y: scaleImagePoint(transform.y),
        scale: scaleImagePoint(transform.k),
        pixelScale,
      };
    }

    return {x: 0, y: 0, scale: 1, pixelScale};
  }

  private computeImageRectangle(): Rectangle & Position {
    const {width: elementWidth, height: elementHeight} = this.getElementSize();
    const {width: imageWidth, height: imageHeight} = this.currentData;

    const scale = Math.max(imageWidth / elementWidth, imageHeight / elementHeight);
    const maxScale = Math.max(scale, 1);
    const width = imageWidth / maxScale;
    const height = imageHeight / maxScale;

    const x = (elementWidth - width) / 2;
    const y = (elementHeight - height) / 2;
    return {x, y, width, height};
  }

  private getPixelScale(): number {
    const {width: elementWidth, height: elementHeight} = this.getElementSize();
    const {width: imageWidth, height: imageHeight} = this.currentData;
    const scale = Math.max(imageWidth / elementWidth, imageHeight / elementHeight);
    return 1 / Math.max(scale, 1);
  }

  private getElementSize(): Rectangle {
    const {offsetWidth, offsetHeight} = this.element.nativeElement;
    return {width: offsetWidth, height: offsetHeight};
  }

  private dataChanged(data: MapImageData): boolean {
    return !deepObjectsEquals(data, this.currentData);
  }

  public onResize() {
    const elementSize = this.getElementSize();
    const bounds = this.computeImageRectangle();
    this.setSvgImageRectangle();

    const {scale, pixelScale} = this.getCurrentTranslate();
    for (const marker of objectValues(this.markers)) {
      const {x, y} = computeMarkerPosition(markerPosition(marker), scale, pixelScale, elementSize, bounds);
      const selection = this.findMarkerContainer(marker);
      if (!selection.empty()) {
        selection
          .attr('x', scaleImagePoint(x))
          .attr('initial-x', scaleImagePoint(computeMarkerInitialX(x, scale, +selection.attr('width'))))
          .attr('y', scaleImagePoint(y))
          .attr('initial-y', scaleImagePoint(computeMarkerInitialY(y, scale, +selection.attr('height'))));
      }
    }
  }

  private findMarkerContainer(marker: MapMarkerProperties): SVGContainer {
    return d3Select.select(`svg[id='${marker.id}']`);
  }

  public destroy() {
    this.clearMarkers(true);
  }
}

function markerPosition(marker: MapMarkerProperties): Position {
  return {x: marker.coordinates.lng, y: marker.coordinates.lat};
}
