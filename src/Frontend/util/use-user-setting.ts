// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DependencyList, useCallback, useEffect } from 'react';

import { UserSettings } from '../../shared/shared-types';
import { useVariable } from './use-variable';

/**
 * Use this hook to get and set app-wide user settings.
 * @param props Specify the user setting key and its default value while hydrating.
 * @param deps Dependency array of the hook.
 * @returns A tuple containing the current value, a setter function and a boolean indicating whether the value has been hydrated.
 */
export const useUserSetting = <T extends keyof UserSettings>(
  { defaultValue, key }: { defaultValue: UserSettings[T]; key: T },
  deps: DependencyList = [],
): [UserSettings[T], (newValue: UserSettings[T]) => Promise<void>, boolean] => {
  const [{ hydrated, storedValue }, setVariable] = useVariable(key, {
    hydrated: false,
    storedValue: defaultValue,
  });

  const setStoredValue = useCallback(
    async (newValue: UserSettings[T]): Promise<void> => {
      setVariable({ hydrated: true, storedValue: newValue ?? defaultValue });
      await window.electronAPI.setUserSetting(key, newValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  const readStoredValue = useCallback(async (): Promise<UserSettings[T]> => {
    const value = await window.electronAPI.getUserSetting(key);

    return value ?? defaultValue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void (async (): Promise<void> => setStoredValue(await readStoredValue()))();
  }, [readStoredValue, setStoredValue]);

  return [storedValue, setStoredValue, hydrated];
};
