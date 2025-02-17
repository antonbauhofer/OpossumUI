// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createFilterOptions, styled } from '@mui/material';
import MuiBadge from '@mui/material/Badge';
import MuiChip from '@mui/material/Chip';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { compact } from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import {
  AutocompleteSignal,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { clickableIcon } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExternalAttributionSources,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { isAuditViewSelected } from '../../state/selectors/view-selector';
import { generatePurl } from '../../util/handle-purl';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { omit, pick } from '../../util/lodash-extension-utils';
import { maybePluralize } from '../../util/maybe-pluralize';
import { openUrl } from '../../util/open-url';
import { PackageSearchHooks } from '../../util/package-search-hooks';
import { useAutocompleteSignals } from '../../web-workers/use-signals-worker';
import { Autocomplete } from '../Autocomplete/Autocomplete';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { IconButton } from '../IconButton/IconButton';
import { PreferredIcon, SourceIcon, WasPreferredIcon } from '../Icons/Icons';

type AutocompleteAttribute = Extract<
  keyof PackageInfo,
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName'
>;

interface Props {
  title: string;
  attribute: AutocompleteAttribute;
  highlight?: 'default' | 'dark';
  endAdornment?: React.ReactElement;
  defaults?: Array<AutocompleteSignal>;
  disabled: boolean;
  showHighlight: boolean | undefined;
  confirmEditWasPreferred: Confirm;
}

const Badge = styled(MuiBadge)({
  '& .MuiBadge-badge': {
    top: '2px',
    right: '2px',
    zIndex: 0,
  },
});

const AddIconButton = styled(MuiIconButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
});

export function PackageAutocomplete({
  attribute,
  title,
  highlight = 'default',
  endAdornment,
  defaults = [],
  disabled,
  showHighlight,
  confirmEditWasPreferred,
}: Props) {
  const dispatch = useAppDispatch();
  const temporaryPackageInfo = useAppSelector(getTemporaryDisplayPackageInfo);
  const attributeValue = temporaryPackageInfo[attribute] || '';
  const [inputValue, setInputValue] = useState(attributeValue);
  const sources = useAppSelector(getExternalAttributionSources);
  const isAuditView = useAppSelector(isAuditViewSelected);

  const { enrichPackageInfo } = PackageSearchHooks.useEnrichPackageInfo();

  const autocompleteSignals = useAutocompleteSignals();
  const filteredSignals = useMemo(
    () =>
      isAuditView
        ? autocompleteSignals
            .filter((signal) => !['', undefined].includes(signal[attribute]))
            .concat(defaults)
        : defaults,
    [isAuditView, autocompleteSignals, defaults, attribute],
  );

  useEffect(() => {
    if (attributeValue !== inputValue) {
      setInputValue(attributeValue);
    }
  }, [attributeValue, inputValue]);

  return (
    <Autocomplete
      title={title}
      disabled={disabled}
      autoHighlight
      disableClearable
      freeSolo
      inputValue={inputValue}
      highlight={
        showHighlight &&
        isImportantAttributionInformationMissing(
          attribute,
          temporaryPackageInfo,
        )
          ? highlight
          : undefined
      }
      options={filteredSignals}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option[attribute] || ''
      }
      getOptionKey={(option) =>
        typeof option === 'string'
          ? option
          : compact([
              option.copyright,
              option.licenseName,
              option[attribute],
              generatePurl(option),
            ]).join()
      }
      renderOptionStartIcon={renderOptionStartIcon}
      renderOptionEndIcon={renderOptionEndIcon}
      value={temporaryPackageInfo}
      filterOptions={createFilterOptions({
        stringify: (option) =>
          attribute === 'packageName'
            ? `${option.packageName || ''}${option.packageNamespace || ''}`
            : option[attribute] || '',
      })}
      isOptionEqualToValue={(option, value) =>
        option[attribute] === value[attribute]
      }
      groupBy={(option) =>
        option.source
          ? sources[option.source.name]?.name || option.source.name
          : text.attributionColumn.manualAttributions
      }
      groupProps={{
        icon: () => <SourceIcon noTooltip />,
        action: ({ name }) => (
          <IconButton
            hidden={name !== text.attributionColumn.openSourceInsights}
            onClick={() => openUrl('https://www.deps.dev')}
            icon={<OpenInNewIcon sx={clickableIcon} />}
          />
        ),
      }}
      optionText={{
        primary: (option) => {
          if (typeof option === 'string') {
            return option;
          }

          const optionValue = option[attribute];

          if (!optionValue) {
            return '';
          }

          return `${optionValue} ${option.suffix || ''}`.trim();
        },
        secondary: (option) =>
          typeof option === 'string' ? option : generatePurl(option),
      }}
      onInputChange={(event, value) =>
        event &&
        temporaryPackageInfo[attribute] !== value &&
        confirmEditWasPreferred(() => {
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...temporaryPackageInfo,
              [attribute]: value,
              wasPreferred: undefined,
            }),
          );
          setInputValue(value);
        })
      }
      endAdornment={endAdornment}
    />
  );

  function renderOptionStartIcon(option: AutocompleteSignal) {
    if (!option.count) {
      return null;
    }

    const tooltipTitle = [
      `${maybePluralize(option.count, text.attributionColumn.occurrence)} ${
        text.attributionColumn.amongSignals
      }`,
      ...(() => {
        if (option.preferred) {
          return [text.auditingOptions.currentlyPreferred.toLowerCase()];
        }
        if (option.wasPreferred) {
          return [text.auditingOptions.previouslyPreferred.toLowerCase()];
        }
        return [];
      })(),
    ].join(' • ');

    return (
      <MuiTooltip title={tooltipTitle} enterDelay={500}>
        <Badge
          badgeContent={(() => {
            if (option.preferred) {
              return <PreferredIcon noTooltip />;
            }
            if (option.wasPreferred) {
              return <WasPreferredIcon noTooltip />;
            }
            return null;
          })()}
        >
          <MuiChip label={option.count} size={'small'} />
        </Badge>
      </MuiTooltip>
    );
  }

  function renderOptionEndIcon(
    option: AutocompleteSignal,
    { closePopper }: { closePopper: () => void },
  ) {
    if (!option.packageName || !option.packageType) {
      return null;
    }

    return (
      <MuiTooltip
        title={text.attributionColumn.useAutocompleteSuggestion}
        enterDelay={1000}
        disableInteractive
      >
        <AddIconButton
          onClick={async (event) => {
            event.stopPropagation();
            const merged: DisplayPackageInfo = {
              ...omit(option, [
                'count',
                'default',
                'preSelected',
                'source',
                'suffix',
              ]),
              ...pick(temporaryPackageInfo, [
                'attributionConfidence',
                'excludeFromNotice',
                'followUp',
                'needsReview',
                'preferred',
              ]),
            };
            dispatch(
              setTemporaryDisplayPackageInfo(
                (option.default && (await enrichPackageInfo(merged))) || merged,
              ),
            );
            closePopper();
          }}
          size={'small'}
        >
          <AddIcon fontSize={'inherit'} color={'primary'} />
        </AddIconButton>
      </MuiTooltip>
    );
  }
}
