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

import {initialWorkflowsState, workflowsAdapter, WorkflowsState} from './workflow.state';
import {WorkflowsAction, WorkflowsActionType} from './workflows.action';
import {WorkflowColumnSettings, WorkflowFooterConfig, WorkflowTableConfig} from './workflow';
import {queryStemsAreSame, queryStemWithoutFilters} from '../navigation/query/query.util';
import {QueryStem} from '../navigation/query/query';
import {appendToArray, removeFromArray} from '../../../shared/utils/array.utils';

export function workflowsReducer(
  state: WorkflowsState = initialWorkflowsState,
  action: WorkflowsAction.All
): WorkflowsState {
  switch (action.type) {
    case WorkflowsActionType.ADD_KANBAN:
      return workflowsAdapter.upsertOne(action.payload.workflow, state);
    case WorkflowsActionType.REMOVE_KANBAN:
      return workflowsAdapter.removeOne(action.payload.workflowId, state);
    case WorkflowsActionType.SET_TABLE_HEIGHT:
      return setTableHeight(state, action);
    case WorkflowsActionType.SET_FOOTER_CONFIG:
      return setFooterConfig(state, action);
    case WorkflowsActionType.TOGGLE_HIERARCHY:
      return toggleHierarchy(state, action);
    case WorkflowsActionType.SET_COLUMN_WIDTH:
      return setColumnWidth(state, action);
    case WorkflowsActionType.SET_CONFIG:
      return workflowsAdapter.updateOne(
        {id: action.payload.workflowId, changes: {config: action.payload.config}},
        state
      );
    case WorkflowsActionType.CLEAR:
      return initialWorkflowsState;
    default:
      return state;
  }
}

function setTableHeight(state: WorkflowsState, action: WorkflowsAction.SetTableHeight): WorkflowsState {
  const {workflowId, collectionId, height, stem, value} = action.payload;
  return setTableProperty(state, workflowId, collectionId, stem, value, table => ({...table, height}));
}

function setFooterConfig(state: WorkflowsState, action: WorkflowsAction.SetFooterConfig): WorkflowsState {
  const {workflowId, attributeId, stem, config} = action.payload;
  return setFooterProperty(state, workflowId, attributeId, stem, footer => ({...footer, ...config}));
}

function toggleHierarchy(state: WorkflowsState, action: WorkflowsAction.ToggleHierarchy): WorkflowsState {
  const {workflowId, collectionId, documentId, stem, value} = action.payload;
  return setTableProperty(state, workflowId, collectionId, stem, value, table => {
    if (table.expandedDocuments?.includes(documentId)) {
      return {...table, expandedDocuments: removeFromArray(table.expandedDocuments, documentId)};
    } else {
      return {...table, expandedDocuments: appendToArray(table.expandedDocuments, documentId)};
    }
  });
}

function setTableProperty(
  state: WorkflowsState,
  workflowId: string,
  collectionId: string,
  stem: QueryStem,
  value: any,
  modifier: (table: WorkflowTableConfig) => WorkflowTableConfig
): WorkflowsState {
  const workflow = state.entities[workflowId];
  if (workflow) {
    const tables = [...(workflow.config.tables || [])];
    const tableIndex = tables.findIndex(
      tab => queryStemsAreSame(tab.stem, stem) && collectionId === tab.collectionId && value === tab.value
    );
    if (tableIndex !== -1) {
      tables[tableIndex] = modifier(tables[tableIndex]);
    } else {
      tables.push(
        modifier({stem: queryStemWithoutFilters(stem), collectionId, value, height: 0, expandedDocuments: []})
      );
    }
    return workflowsAdapter.updateOne({id: workflowId, changes: {config: {...workflow.config, tables}}}, state);
  }

  return state;
}

function setFooterProperty(
  state: WorkflowsState,
  workflowId: string,
  attributeId: string,
  stem: QueryStem,
  modifier: (table: WorkflowFooterConfig) => WorkflowFooterConfig
): WorkflowsState {
  const workflow = state.entities[workflowId];
  if (workflow) {
    const footers = [...(workflow.config.footers || [])];
    const footerIndex = footers.findIndex(f => queryStemsAreSame(f.stem, stem) && attributeId === f.attributeId);
    if (footerIndex !== -1) {
      footers[footerIndex] = modifier(footers[footerIndex]);
    } else {
      footers.push(modifier({stem: queryStemWithoutFilters(stem), attributeId}));
    }
    return workflowsAdapter.updateOne({id: workflowId, changes: {config: {...workflow.config, footers}}}, state);
  }

  return state;
}

function setColumnWidth(state: WorkflowsState, action: WorkflowsAction.SetColumnWidth): WorkflowsState {
  const {workflowId, linkTypeId, collectionId, width, attributeId} = action.payload;
  const workflow = state.entities[workflowId];
  if (workflow) {
    let columns = workflow.config.columns || {collections: {}, linkTypes: {}};
    if (collectionId) {
      const settings = setAttributeSettingsParams(attributeId, columns.collections?.[collectionId], {width});
      const collections = {...columns.collections, [collectionId]: settings};
      columns = {...columns, collections};
    } else if (linkTypeId) {
      const settings = setAttributeSettingsParams(attributeId, columns.linkTypes?.[linkTypeId], {width});
      const linkTypes = {...columns.linkTypes, [linkTypeId]: settings};
      columns = {...columns, linkTypes};
    }
    return workflowsAdapter.updateOne({id: workflowId, changes: {config: {...workflow.config, columns}}}, state);
  }

  return state;
}

function setAttributeSettingsParams(
  attributeId: string,
  settings: WorkflowColumnSettings[],
  params: Partial<Record<keyof WorkflowColumnSettings, any>>
): WorkflowColumnSettings[] {
  const copy = [...(settings || [])];
  const index = copy.findIndex(set => set.attributeId === attributeId);
  if (index !== -1) {
    copy.splice(index, 1, {...copy[index], ...params});
  } else {
    copy.push({attributeId, ...params});
  }

  return copy;
}
