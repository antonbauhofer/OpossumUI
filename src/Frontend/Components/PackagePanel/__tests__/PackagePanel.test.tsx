// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';

import {
  Attributions,
  ExternalAttributionSources,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import { setExternalAttributionSources } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { DisplayPackageInfosWithCount } from '../../../types/types';
import { PackagePanel } from '../PackagePanel';

describe('The PackagePanel', () => {
  it('renders TextBoxes with right content', () => {
    const testSource = { name: 'HC', documentConfidence: 1 };
    const testSortedPackageCardIds = [
      'Contained Signals-0',
      'Contained Signals-1',
      'Contained Signals-2',
    ];
    const testDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [testSortedPackageCardIds[0]]: {
        displayPackageInfo: {
          source: testSource,
          packageName: 'React',
          packageVersion: '16.5.0',
          attributionIds: ['uuid1'],
        },
        count: 1,
      },
      [testSortedPackageCardIds[1]]: {
        displayPackageInfo: {
          source: testSource,
          packageName: 'JQuery',
          attributionIds: ['uuid2'],
        },
        count: 1,
      },
      [testSortedPackageCardIds[2]]: {
        displayPackageInfo: {
          source: testSource,
          attributionIds: ['uuid3'],
        },
        count: 1,
      },
    };

    const testAttributions: Attributions = {
      uuid1: {
        source: testSource,
        packageName: 'React',
        packageVersion: '16.5.0',
      },
      uuid2: {
        source: testSource,
        packageName: 'JQuery',
      },
      uuid3: { source: testSource },
    };
    renderComponent(
      <PackagePanel
        displayPackageInfosWithCount={testDisplayPackageInfosWithCount}
        sortedPackageCardIds={testSortedPackageCardIds}
        title={PackagePanelTitle.ContainedExternalPackages}
        isAddToPackageEnabled={true}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              externalAttributions: testAttributions,
            }),
          ),
        ],
      },
    );

    expect(screen.getByText('React, 16.5.0')).toBeInTheDocument();
    expect(screen.getByText('JQuery')).toBeInTheDocument();
    expect(screen.getAllByLabelText('show resources')).not.toHaveLength(0);
  });

  it('groups by source and prettifies known sources', () => {
    const testSortedPackageCardIds = [
      'Contained Signals-0',
      'Contained Signals-1',
      'Contained Signals-2',
    ];
    const testDisplayPackageInfosWithCount: DisplayPackageInfosWithCount = {
      [testSortedPackageCardIds[0]]: {
        displayPackageInfo: {
          source: { name: 'other', documentConfidence: 1 },
          packageName: 'React',
          packageVersion: '16.5.0',
          attributionIds: ['uuid1'],
        },
        count: 1,
      },
      [testSortedPackageCardIds[1]]: {
        displayPackageInfo: {
          source: { name: 'SC', documentConfidence: 1 },
          packageName: 'JQuery',
          attributionIds: ['uuid2'],
        },
        count: 1,
      },
      [testSortedPackageCardIds[2]]: {
        displayPackageInfo: {
          packageName: 'JQuery 2',
          attributionIds: ['uuid3'],
        },
        count: 1,
      },
    };

    const testAttributions: Attributions = {
      uuid1: {
        source: { name: 'other', documentConfidence: 1 },
        packageName: 'React',
        packageVersion: '16.5.0',
      },
      uuid2: {
        source: { name: 'SC', documentConfidence: 1 },
        packageName: 'JQuery',
      },
      uuid3: {
        packageName: 'JQuery 2',
      },
    };
    const testAttributionSources: ExternalAttributionSources = {
      SC: { name: 'ScanCode', priority: 3 },
    };
    renderComponent(
      <PackagePanel
        displayPackageInfosWithCount={testDisplayPackageInfosWithCount}
        sortedPackageCardIds={testSortedPackageCardIds}
        title={PackagePanelTitle.ContainedExternalPackages}
        isAddToPackageEnabled={true}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              externalAttributions: testAttributions,
            }),
          ),
          setExternalAttributionSources(testAttributionSources),
        ],
      },
    );

    const hhcPanel = screen.getByText('ScanCode').parentElement as HTMLElement;
    expect(within(hhcPanel).getByText('JQuery')).toBeInTheDocument();

    const highComputePanel = screen.getByText('other')
      .parentElement as HTMLElement;
    expect(
      within(highComputePanel).getByText('React, 16.5.0'),
    ).toBeInTheDocument();

    expect(screen.getByText('JQuery 2')).toBeInTheDocument();
  });
});
