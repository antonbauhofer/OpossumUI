// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { configureStore } from '@reduxjs/toolkit';

import { reducer } from './reducer';
import { AppThunkAction } from './types';

export type Store = ReturnType<typeof createAppStore>;
export type Action = AppThunkAction | Parameters<Store['dispatch']>[0];

export function createAppStore() {
  return configureStore({
    reducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // TECH DEBT: we should not be putting sets into the store
        // https://redux.js.org/style-guide/#do-not-put-non-serializable-values-in-state-or-actions
        serializableCheck: false,
        immutableCheck: true,
      }),
  });
}
