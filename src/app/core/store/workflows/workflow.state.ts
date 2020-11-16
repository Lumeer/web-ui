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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {DEFAULT_WORKFLOW_ID, Workflow} from './workflow';
import {selectWorkspace} from '../navigation/navigation.state';

export interface WorkflowsState extends EntityState<Workflow> {
  selectedDocumentId?: string;
}

export const workflowsAdapter = createEntityAdapter<Workflow>({selectId: workflow => workflow.id});

export const initialWorkflowsState: WorkflowsState = workflowsAdapter.getInitialState();

export const selectWorkflowsState = (state: AppState) => state.workflows;
export const selectWorkflowsDictionary = createSelector(
  selectWorkflowsState,
  workflowsAdapter.getSelectors().selectEntities
);
export const selectWorkflowById = id => createSelector(selectWorkflowsDictionary, workflows => workflows[id]);

export const selectWorkflowSelectedDocumentId = createSelector(selectWorkflowsState, state => state.selectedDocumentId);

export const selectWorkflowId = createSelector(
  selectWorkspace,
  workspace => workspace?.viewCode || DEFAULT_WORKFLOW_ID
);

export const selectWorkflow = createSelector(selectWorkflowsDictionary, selectWorkflowId, (map, id) => map[id]);
export const selectWorkflowConfig = createSelector(selectWorkflow, workflow => workflow?.config);
