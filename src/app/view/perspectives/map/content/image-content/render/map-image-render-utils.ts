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

import {shadeColor} from '../../../../../../shared/utils/html-modifier';
import * as d3Select from 'd3-selection';
import {MapMarkerProperties} from '../../../../../../core/store/maps/map.model';

export type SVGContainer = d3Select.Selection<SVGElement, any, any, any>;

export function addMarkerToSvgContainer(
  container: SVGContainer,
  properties: MapMarkerProperties,
  width: number = 30,
  height: number = 40
): SVGContainer {
  const x = properties.coordinates.lat;
  const y = properties.coordinates.lng;

  const marker = container
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('x', x)
    .attr('initial-x', x)
    .attr('y', y)
    .attr('initial-y', y)
    .attr('viewBox', `${-width / 2} ${-height} ${width} ${height}`)
    .style('cursor', 'pointer');

  marker
    .append('path')
    .attr('d', markerPath(height, width / 2))
    .style('fill', properties.color);

  const circleCenterY = -height + width / 2;
  marker
    .append('circle')
    .attr('cx', 0)
    .attr('cy', circleCenterY)
    .attr('r', width / 2 - 4)
    .attr('fill', shadeColor(properties.color, -0.3));

  const fontSize = 12;

  marker
    .append('text')
    .attr('x', 0)
    .attr('y', circleCenterY)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#ffffff')
    .style('font-family', '"Font Awesome 5 Pro"')
    .style('font-size', `${fontSize}px`)
    .text(() => '\uf6bb');

  return marker;
}

function markerPath(height: number, radius: number): string {
  const dyAC = height - radius;
  const alpha = Math.acos(radius / dyAC);
  const deltaX = radius * Math.sin(alpha);
  const deltaY = (height * (height - radius * 2)) / dyAC;
  return `M 0,0
    L ${-deltaX},${-deltaY}
    A ${radius} ${radius} 1 1 1 ${deltaX},${-deltaY}
    L 0,0 z`;
}
