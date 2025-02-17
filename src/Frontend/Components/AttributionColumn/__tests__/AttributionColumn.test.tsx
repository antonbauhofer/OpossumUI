// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  FollowUp,
  FrequentLicenses,
  Resources,
  ResourcesToAttributions,
  SaveFileArgs,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { AttributionType } from '../../../enums/enums';
import {
  setFrequentLicenses,
  setTemporaryDisplayPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { clickGoToLinkIcon } from '../../../test-helpers/attribution-column-test-helpers';
import {
  clickOnButton,
  getParsedInputFileEnrichedWithTestData,
} from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { convertPackageInfoToDisplayPackageInfo } from '../../../util/convert-package-info';
import { generatePurl } from '../../../util/handle-purl';
import { AttributionColumn } from '../AttributionColumn';

describe('The AttributionColumn', () => {
  it('renders TextBoxes with right titles and content', () => {
    const temporaryDisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comments: ['some comment'],
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
      attributionIds: [],
    } satisfies DisplayPackageInfo;
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [
          setSelectedResourceId('test_id'),
          setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
        ],
      },
    );

    expect(
      screen.getByText(text.attributionColumn.packageSubPanel.confidence),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('confidence of 1')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.packageType),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.packageType),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(
        text.attributionColumn.packageSubPanel.packageNamespace,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.packageNamespace),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.packageName),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.packageName),
    ).toBeInTheDocument();
    expect(
      screen.queryAllByText(
        text.attributionColumn.packageSubPanel.packageVersion,
      ),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.packageVersion),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('(Defined in parent folder)'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Override parent')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copyright')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.copyright),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('License Name')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.licenseName),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.repositoryUrl,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(temporaryDisplayPackageInfo.url),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/License Text/)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Permission is hereby granted', {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();
    const comment = temporaryDisplayPackageInfo.comments
      ? temporaryDisplayPackageInfo.comments[0]
      : '';
    expect(screen.getByDisplayValue(comment)).toBeInTheDocument();
    expect(
      screen.queryAllByText(text.attributionColumn.packageSubPanel.purl),
    ).toHaveLength(2);
    expect(
      screen.getByDisplayValue('pkg:type/namespace/jQuery@16.5.0'),
    ).toBeInTheDocument();
  });

  it('copies PURL to clipboard', async () => {
    const writeText = jest.fn();
    (navigator.clipboard as unknown) = { writeText };
    const packageInfo = faker.opossum.displayPackageInfo();
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      { actions: [setTemporaryDisplayPackageInfo(packageInfo)] },
    );

    await userEvent.click(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.copyToClipboard,
      ),
    );

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(generatePurl(packageInfo));
  });

  it('pastes PURL from clipboard', async () => {
    const packageInfo = faker.opossum.displayPackageInfo();
    const purl = generatePurl(packageInfo);
    const readText = jest.fn().mockReturnValue(purl.toString());
    (navigator.clipboard as unknown) = { readText };
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );

    await userEvent.click(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.pasteFromClipboard,
      ),
    );

    expect(readText).toHaveBeenCalledTimes(1);
    expect(
      screen.getByDisplayValue(packageInfo.packageName!),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(packageInfo.packageVersion!),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(packageInfo.packageType!),
    ).toBeInTheDocument();
  });

  it('renders a source name, if it is defined', () => {
    const temporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: faker.opossum.source(),
      attributionIds: [],
    };
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [
          setSelectedResourceId('test_id'),
          setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
        ],
      },
    );

    expect(
      screen.getByText(temporaryDisplayPackageInfo.source!.name),
    ).toBeInTheDocument();
  });

  it('renders the name of the original source', () => {
    const temporaryDisplayPackageInfo: DisplayPackageInfo = {
      source: faker.opossum.source({
        additionalName: faker.company.name(),
      }),
      attributionIds: [],
    };

    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo)],
      },
    );

    expect(
      screen.getByText(temporaryDisplayPackageInfo.source!.additionalName!),
    ).toBeInTheDocument();
  });

  it('renders original signal source for manual attributions', () => {
    const [resourceName] = faker.opossum.resourceNames({ count: 1 });
    const resources: Resources = faker.opossum.resources({
      [resourceName]: 1,
    });
    const originId = faker.string.uuid();
    const [externalAttributionId, externalPackageInfo] =
      faker.opossum.externalAttribution({ originIds: [originId] });
    const externalAttributions: Attributions =
      faker.opossum.externalAttributions({
        [externalAttributionId]: externalPackageInfo,
      });
    const resourcesToExternalAttributions: ResourcesToAttributions =
      faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName)]: [externalAttributionId],
      });
    const [manualAttributionId, manualPackageInfo] =
      faker.opossum.manualAttribution({
        originIds: externalPackageInfo.originIds,
      });
    const manualAttributions: Attributions = faker.opossum.manualAttributions({
      [manualAttributionId]: manualPackageInfo,
    });
    const resourcesToManualAttributions: ResourcesToAttributions =
      faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName)]: [manualAttributionId],
      });

    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [
          loadFromFile(
            getParsedInputFileEnrichedWithTestData({
              resources,
              manualAttributions,
              resourcesToManualAttributions,
              externalAttributions,
              resourcesToExternalAttributions,
            }),
          ),
          setTemporaryDisplayPackageInfo(
            convertPackageInfoToDisplayPackageInfo(manualPackageInfo, [
              manualAttributionId,
            ]),
          ),
        ],
      },
    );

    expect(
      screen.getByText(
        text.attributionColumn.originallyFrom +
          externalPackageInfo.source!.name,
      ),
    ).toBeInTheDocument();
  });

  it('renders a chip for follow-up', async () => {
    const { store } = renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).followUp,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(screen.getByText(text.auditingOptions.followUp));
    await userEvent.keyboard('{Escape}');

    expect(getTemporaryDisplayPackageInfo(store.getState()).followUp).toBe(
      FollowUp,
    );
  });

  it('renders a chip for exclude from notice', async () => {
    const { store } = renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(
      screen.getByText(text.auditingOptions.excludedFromNotice),
    );
    await userEvent.keyboard('{Escape}');
    expect(
      getTemporaryDisplayPackageInfo(store.getState()).excludeFromNotice,
    ).toBe(true);
  });

  it('renders a chip for needs review', async () => {
    const { store } = renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
    );

    expect(
      getTemporaryDisplayPackageInfo(store.getState()).needsReview,
    ).toBeUndefined();

    await userEvent.click(screen.getByText(text.auditingOptions.add));
    await userEvent.click(screen.getByText(text.auditingOptions.needsReview));
    await userEvent.keyboard('{Escape}');

    expect(getTemporaryDisplayPackageInfo(store.getState()).needsReview).toBe(
      true,
    );
  });

  it('renders a URL icon and opens a link in browser', () => {
    const temporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: 'https://www.testurl.com/',
      attributionIds: [],
    };
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo)],
      },
    );

    expect(screen.getByLabelText('Url icon')).toBeInTheDocument();
    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      temporaryDisplayPackageInfo.url,
    );
  });

  it('opens a link without protocol', () => {
    const temporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: 'www.testurl.com',
      attributionIds: [],
    };
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo)],
      },
    );

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      `https://${temporaryDisplayPackageInfo.url}`,
    );
  });

  it('hides url icon if empty url', () => {
    const temporaryDisplayPackageInfo: DisplayPackageInfo = {
      url: '',
      attributionIds: [],
    };
    renderComponent(
      <AttributionColumn
        isEditable={true}
        onSaveButtonClick={noop}
        onSaveGloballyButtonClick={noop}
        saveFileRequestListener={noop}
        onDeleteButtonClick={noop}
        onDeleteGloballyButtonClick={noop}
      />,
      {
        actions: [setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo)],
      },
    );

    expect(screen.queryByLabelText('Url icon')).not.toBeInTheDocument();
  });

  describe('there are different license text labels', () => {
    it('shows standard text if editable and non frequent license', () => {
      const temporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        attributionIds: [],
      };
      renderComponent(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
        {
          actions: [
            setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
          ],
        },
      );

      expect(
        screen.getByLabelText(
          'License Text (to appear in attribution document)',
        ),
      ).toBeInTheDocument();
    });

    it('shows shortened text if not editable and frequent license', () => {
      const temporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        licenseName: 'Mit',
        attributionIds: [],
      };
      const frequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      renderComponent(
        <AttributionColumn
          isEditable={false}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
        {
          actions: [
            setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
            setFrequentLicenses(frequentLicenses),
          ],
        },
      );

      expect(
        screen.getByLabelText('Standard license text implied.'),
      ).toBeInTheDocument();
    });

    it('shows long text if editable and frequent license', () => {
      const temporaryDisplayPackageInfo: DisplayPackageInfo = {
        packageName: 'jQuery',
        licenseName: 'mit',
        attributionIds: [],
      };
      const frequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      renderComponent(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
        {
          actions: [
            setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
            setFrequentLicenses(frequentLicenses),
          ],
        },
      );

      expect(
        screen.getByLabelText(
          'Standard license text implied. Insert notice text if necessary.',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('while changing the first party value', () => {
    it('sets first party flag and hides third party inputs when choosing first party', async () => {
      const { store } = renderComponent(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
        />,
      );

      expect(
        getTemporaryDisplayPackageInfo(store.getState()).copyright,
      ).toBeUndefined();

      await userEvent.click(
        screen.getByRole('button', { name: AttributionType.FirstParty }),
      );

      expect(getTemporaryDisplayPackageInfo(store.getState()).firstParty).toBe(
        true,
      );
      expect(screen.queryByLabelText('Copyright')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('License Name')).not.toBeInTheDocument();
    });
  });

  describe('The ResolveButton', () => {
    it('saves resolved external attributions', () => {
      const temporaryDisplayPackageInfo: DisplayPackageInfo = {
        attributionIds: ['TestId'],
      };
      const expectedSaveFileArgs: SaveFileArgs = {
        manualAttributions: {},
        resolvedExternalAttributions: new Set<string>().add('TestId'),
        resourcesToAttributions: {},
      };
      renderComponent(
        <AttributionColumn
          isEditable={true}
          onSaveButtonClick={noop}
          onSaveGloballyButtonClick={noop}
          saveFileRequestListener={noop}
          onDeleteButtonClick={noop}
          onDeleteGloballyButtonClick={noop}
          showHideButton
        />,
        {
          actions: [
            setTemporaryDisplayPackageInfo(temporaryDisplayPackageInfo),
          ],
        },
      );

      clickOnButton(screen, 'resolve attribution');
      expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
        expectedSaveFileArgs,
      );
    });
  });
});
