// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, orderBy } from 'lodash';

import {
  AutocompleteSignal,
  ExternalAttributionSources,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  getContainedExternalPackages,
  getContainedManualPackages,
  PanelAttributionData,
} from '../../util/get-contained-packages';
import { generatePurl } from '../../util/handle-purl';

export interface Props {
  externalData: PanelAttributionData;
  manualData: PanelAttributionData;
  resolvedExternalAttributions: Set<string>;
  resourceId: string;
  sources: ExternalAttributionSources;
}

export function getAutocompleteSignals({
  externalData,
  manualData,
  resolvedExternalAttributions,
  resourceId,
  sources,
}: Props) {
  const signalsOnResource = (
    externalData.resourcesToAttributions[resourceId] || []
  ).map((id) => externalData.attributions[id]);
  const signalsOnChildren = getContainedExternalPackages(
    resourceId,
    externalData.resourcesWithAttributedChildren,
    externalData.resourcesToAttributions,
    resolvedExternalAttributions,
  ).map(({ attributionId }) => externalData.attributions[attributionId]);
  const attributionsOnChildren = getContainedManualPackages(
    resourceId,
    manualData,
  ).map(({ attributionId }) => manualData.attributions[attributionId]);

  const getUniqueKey = (item: PackageInfo) =>
    compact([
      item.source && sources[item.source.name]?.name,
      item.copyright,
      item.licenseName,
      generatePurl(item),
    ]).join();

  const signals = [
    ...signalsOnResource,
    ...signalsOnChildren,
    ...attributionsOnChildren,
  ].reduce<Array<AutocompleteSignal>>((acc, { comment, ...signal }) => {
    if (!generatePurl(signal) || signal.preferred) {
      return acc;
    }

    const key = getUniqueKey(signal);
    const dupeIndex = acc.findIndex((item) => getUniqueKey(item) === key);

    if (dupeIndex === -1) {
      acc.push({
        attributionIds: [],
        count: 1,
        comments: comment ? [comment] : undefined,
        ...signal,
      });
    } else {
      acc[dupeIndex] = {
        ...acc[dupeIndex],
        count: (acc[dupeIndex].count ?? 0) + 1,
        wasPreferred: acc[dupeIndex].wasPreferred || signal.wasPreferred,
      };
    }

    return acc;
  }, []);

  return orderBy(
    signals,
    [
      ({ source }) => (source && sources[source.name])?.priority ?? 0,
      ({ wasPreferred }) => (wasPreferred ? 1 : 0),
      ({ count }) => count ?? 0,
    ],
    ['desc', 'desc', 'desc'],
  );
}
