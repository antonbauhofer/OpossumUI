// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { ButtonText } from '../../../enums/enums';
import { setMultiSelectSelectedAttributionIds } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import {
  clickOnButton,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ConfirmMultiSelectDeletionPopup } from '../ConfirmMultiSelectDeletionPopup';

describe('The ConfirmMultiSelectDeletionPopup', () => {
  it('renders', () => {
    const expectedContent =
      'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.';
    const expectedHeader = 'Confirm Deletion';

    const { store } = renderComponent(<ConfirmMultiSelectDeletionPopup />);
    act(() => {
      store.dispatch(
        setMultiSelectSelectedAttributionIds(['uuid_1', 'uuid_2']),
      );
    });

    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });

  it('deletes attributions', () => {
    const expectedContent =
      'Do you really want to delete the selected attributions for all files? This action will delete 2 attributions.';
    const expectedHeader = 'Confirm Deletion';

    const testResources: Resources = {
      'something.js': 1,
      'somethingElse.js': 1,
    };
    const testManualAttributions: Attributions = {
      uuid1: {
        packageName: 'React',
      },
      uuid2: {
        packageName: 'Vue',
      },
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': ['uuid1'],
      '/somethingElse.js': ['uuid2'],
    };

    const { store } = renderComponent(<ConfirmMultiSelectDeletionPopup />, {
      actions: [
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            resources: testResources,
            manualAttributions: testManualAttributions,
            resourcesToManualAttributions: testResourcesToManualAttributions,
          }),
        ),
        setMultiSelectSelectedAttributionIds(['uuid1', 'uuid2']),
      ],
    });
    act(() => {
      store.dispatch(setMultiSelectSelectedAttributionIds(['uuid1', 'uuid2']));
    });
    expect(screen.getByText(expectedContent)).toBeInTheDocument();
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
    clickOnButton(screen, ButtonText.Confirm);
    expect(getManualAttributions(store.getState())).toEqual({});
  });
});
