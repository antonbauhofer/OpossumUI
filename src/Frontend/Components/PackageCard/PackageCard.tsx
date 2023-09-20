// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import { ListCard } from '../ListCard/ListCard';
import { getCardLabels } from '../../util/get-card-labels';
import { ListCardConfig, PackageCardConfig } from '../../types/types';
import { clickableIcon } from '../../shared-styles';
import { IconButton } from '../IconButton/IconButton';
import PlusIcon from '@mui/icons-material/Add';
import { ContextMenu, ContextMenuItem } from '../ContextMenu/ContextMenu';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { useSelector } from 'react-redux';
import {
  getAttributionIdMarkedForReplacement,
  getManualAttributions,
  getManualAttributionsToResources,
  wereTemporaryDisplayPackageInfoModified,
} from '../../state/selectors/all-views-resource-selectors';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  unlinkAttributionAndSavePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { ResourcePathPopup } from '../ResourcePathPopup/ResourcePathPopup';
import { getSelectedView } from '../../state/selectors/view-selector';
import {
  getMultiSelectSelectedAttributionIds,
  getSelectedAttributionIdInAttributionView,
} from '../../state/selectors/attribution-view-resource-selectors';
import {
  getMergeButtonsDisplayState,
  getResolvedToggleHandler,
  MergeButtonDisplayState,
  selectedPackagesAreResolved,
} from '../AttributionColumn/attribution-column-helpers';
import {
  setAttributionIdMarkedForReplacement,
  setMultiSelectSelectedAttributionIds,
} from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { Checkbox } from '../Checkbox/Checkbox';
import {
  getKey,
  getPackageCardHighlighting,
  getRightIcons,
} from './package-card-helpers';
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import MuiBox from '@mui/material/Box';
import { openAttributionWizardPopup } from '../../state/actions/popup-actions/popup-actions';

const classes = {
  hiddenIcon: {
    visibility: 'hidden',
  },
  clickableIcon,
  multiSelectCheckbox: {
    height: '40px',
    marginTop: '1px',
  },
  multiSelectPackageCard: {
    flexGrow: 1,
    minWidth: '0px',
  },
};

interface PackageCardProps {
  cardId: string;
  displayPackageInfo: DisplayPackageInfo;
  packageCount?: number;
  cardConfig: PackageCardConfig;
  onClick(): void;
  onIconClick?(): void;
  showOpenResourcesIcon?: boolean;
  hideContextMenuAndMultiSelect?: boolean;
  hideResourceSpecificButtons?: boolean;
  showCheckBox?: boolean;
  hideAttributionWizardContextMenuItem?: boolean;
}

export function PackageCard(props: PackageCardProps): ReactElement | null {
  const dispatch = useAppDispatch();
  const selectedView = useSelector(getSelectedView);
  const selectedAttributionIdAttributionView = useSelector(
    getSelectedAttributionIdInAttributionView,
  );
  const selectedAttributionIdAuditView =
    useSelector(getAttributionIdOfDisplayedPackageInManualPanel) ?? '';
  const manualAttributions = useSelector(getManualAttributions);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const attributionsToResources = useSelector(getManualAttributionsToResources);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const packageInfoWereModified = useAppSelector(
    wereTemporaryDisplayPackageInfoModified,
  );
  const attributionIdMarkedForReplacement = useAppSelector(
    getAttributionIdMarkedForReplacement,
  );
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [showAssociatedResourcesPopup, setShowAssociatedResourcesPopup] =
    useState<boolean>(false);

  const isExternalAttribution = Boolean(props.cardConfig.isExternalAttribution);
  const isPreselected = Boolean(props.cardConfig.isPreSelected);
  const packageLabels = getCardLabels(props.displayPackageInfo);
  const attributionIds = props.displayPackageInfo.attributionIds;
  const selectedAttributionId =
    selectedView === View.Attribution
      ? selectedAttributionIdAttributionView
      : selectedAttributionIdAuditView;

  function getListCardConfig(): ListCardConfig {
    let listCardConfig: ListCardConfig = {
      ...props.cardConfig,
      firstParty: props.displayPackageInfo.firstParty,
      excludeFromNotice: props.displayPackageInfo.excludeFromNotice,
      needsReview: Boolean(props.displayPackageInfo.needsReview),
      followUp: Boolean(props.displayPackageInfo.followUp),
      isContextMenuOpen,
      criticality: props.cardConfig.isExternalAttribution
        ? props.displayPackageInfo.criticality
        : props.displayPackageInfo.preSelected
        ? props.displayPackageInfo.criticality
        : undefined,
    };
    if (!isExternalAttribution) {
      const attributionId = attributionIds[0];
      listCardConfig = {
        ...listCardConfig,
        isMarkedForReplacement:
          Boolean(attributionId) &&
          attributionId === attributionIdMarkedForReplacement,
        isMultiSelected:
          multiSelectSelectedAttributionIds.includes(attributionId),
      };
    }

    return listCardConfig;
  }

  const listCardConfig = getListCardConfig();

  const highlighting =
    selectedView === View.Attribution
      ? getPackageCardHighlighting(props.displayPackageInfo)
      : undefined;

  const displayAttributionIds = props.displayPackageInfo.attributionIds;

  function getContextMenuItemsForManualAttributions(): Array<ContextMenuItem> {
    const attributionId = attributionIds[0];
    function openConfirmDeletionPopup(): void {
      if (isPreselected) {
        dispatch(
          deleteAttributionAndSave(
            selectedResourceId,
            attributionId,
            selectedAttributionId,
          ),
        );
      } else {
        dispatch(openPopup(PopupType.ConfirmDeletionPopup, attributionId));
      }
    }

    function openConfirmDeletionGloballyPopup(): void {
      if (isPreselected) {
        dispatch(
          deleteAttributionGloballyAndSave(
            attributionId,
            selectedAttributionId,
          ),
        );
      } else {
        dispatch(
          openPopup(PopupType.ConfirmDeletionGloballyPopup, attributionId),
        );
      }
    }

    function confirmAttribution(): void {
      const packageInfo = manualAttributions[attributionId];
      if (attributionsToResources[attributionId].length === 1) {
        confirmAttributionGlobally(attributionId);
      } else {
        dispatch(
          unlinkAttributionAndSavePackageInfo(
            selectedResourceId,
            attributionId,
            packageInfo,
            selectedAttributionId,
          ),
        );
      }
    }

    function confirmAttributionGlobally(currentAttributionId: string): void {
      dispatch(
        savePackageInfo(
          null,
          currentAttributionId,
          manualAttributions[currentAttributionId],
          currentAttributionId !== selectedAttributionId,
        ),
      );
    }

    function confirmSelectedAttributionsGlobally(): void {
      multiSelectSelectedAttributionIds.forEach((currentAttributionId) => {
        if (manualAttributions[currentAttributionId].preSelected) {
          confirmAttributionGlobally(currentAttributionId);
        }
      });
      dispatch(setMultiSelectSelectedAttributionIds([]));
    }

    const someSelectedAttributionsArePreSelected =
      multiSelectSelectedAttributionIds.some(
        (currentAttributionId) =>
          manualAttributions[currentAttributionId].preSelected,
      );

    const hideResourceSpecificButtons = Boolean(
      props.hideResourceSpecificButtons,
    );
    const showGlobalButtons =
      !isExternalAttribution &&
      (hasAttributionMultipleResources(
        attributionId,
        attributionsToResources,
      ) ||
        hideResourceSpecificButtons);
    const mergeButtonDisplayState: MergeButtonDisplayState =
      getMergeButtonsDisplayState({
        attributionIdMarkedForReplacement,
        targetAttributionId: attributionId,
        selectedAttributionId,
        packageInfoWereModified,
        targetAttributionIsPreSelected: isPreselected,
        targetAttributionIsExternalAttribution: isExternalAttribution,
      });

    return props.hideContextMenuAndMultiSelect
      ? []
      : [
          {
            buttonText: ButtonText.Delete,
            onClick: openConfirmDeletionPopup,
            hidden: isExternalAttribution || hideResourceSpecificButtons,
          },
          {
            buttonText: ButtonText.DeleteGlobally,
            onClick: openConfirmDeletionGloballyPopup,
            hidden: isExternalAttribution || !showGlobalButtons,
          },
          {
            buttonText: ButtonText.DeleteSelectedGlobally,
            onClick: (): void => {
              dispatch(openPopup(PopupType.ConfirmMultiSelectDeletionPopup));
            },
            hidden: multiSelectSelectedAttributionIds.length === 0,
          },
          {
            buttonText: ButtonText.Confirm,
            onClick: confirmAttribution,
            hidden:
              !isPreselected ||
              isExternalAttribution ||
              hideResourceSpecificButtons,
          },
          {
            buttonText: ButtonText.ConfirmGlobally,
            onClick: (): void => confirmAttributionGlobally(attributionId),
            hidden: !isPreselected || !showGlobalButtons,
          },
          {
            buttonText: ButtonText.ConfirmSelectedGlobally,
            onClick: confirmSelectedAttributionsGlobally,
            hidden:
              multiSelectSelectedAttributionIds.length === 0 ||
              !someSelectedAttributionsArePreSelected,
          },
          {
            buttonText: ButtonText.ShowResources,
            onClick: (): void => setShowAssociatedResourcesPopup(true),
          },
          {
            buttonText: ButtonText.MarkForReplacement,
            onClick: (): void => {
              dispatch(setAttributionIdMarkedForReplacement(attributionId));
            },
            hidden: mergeButtonDisplayState.hideMarkForReplacementButton,
          },
          {
            buttonText: ButtonText.UnmarkForReplacement,
            onClick: (): void => {
              dispatch(setAttributionIdMarkedForReplacement(''));
            },
            hidden: mergeButtonDisplayState.hideUnmarkForReplacementButton,
          },
          {
            buttonText: ButtonText.ReplaceMarked,
            disabled: mergeButtonDisplayState.deactivateReplaceMarkedByButton,
            onClick: (): void => {
              dispatch(
                openPopup(PopupType.ReplaceAttributionPopup, attributionId),
              );
            },
            hidden: mergeButtonDisplayState.hideReplaceMarkedByButton,
          },
          {
            buttonText: ButtonText.OpenAttributionWizardPopup,
            disabled: false,
            hidden:
              isExternalAttribution ||
              hideResourceSpecificButtons ||
              props.hideAttributionWizardContextMenuItem,
            onClick: (): void => {
              dispatch(openAttributionWizardPopup(attributionId));
            },
          },
        ];
  }

  function getContextMenuItemsForExternalAttributions(): Array<ContextMenuItem> {
    return props.hideContextMenuAndMultiSelect
      ? []
      : [
          {
            buttonText: ButtonText.ShowResources,
            onClick: (): void => setShowAssociatedResourcesPopup(true),
          },
          {
            buttonText: selectedPackagesAreResolved(
              displayAttributionIds,
              resolvedExternalAttributions,
            )
              ? ButtonText.Unhide
              : ButtonText.Hide,
            onClick: getResolvedToggleHandler(
              displayAttributionIds,
              resolvedExternalAttributions,
              dispatch,
            ),
            hidden: !isExternalAttribution,
          },
        ];
  }

  function toggleIsContextMenuOpen(): void {
    setIsContextMenuOpen(!isContextMenuOpen);
  }

  function getLeftElementForManualAttribution(): ReactElement | undefined {
    const attributionId = attributionIds[0];

    function handleMultiSelectAttributionSelected(
      event: React.ChangeEvent<HTMLInputElement>,
    ): void {
      const newMultiSelectSelectedAttributionIds = event.target.checked
        ? multiSelectSelectedAttributionIds.concat([attributionId])
        : multiSelectSelectedAttributionIds.filter(
            (id) => id !== attributionId,
          );

      dispatch(
        setMultiSelectSelectedAttributionIds(
          newMultiSelectSelectedAttributionIds,
        ),
      );
    }

    return props.showCheckBox && !props.hideContextMenuAndMultiSelect ? (
      <Checkbox
        checked={multiSelectSelectedAttributionIds.includes(attributionId)}
        onChange={handleMultiSelectAttributionSelected}
        sx={classes.multiSelectCheckbox}
      />
    ) : undefined;
  }

  const leftElement = isExternalAttribution
    ? undefined
    : getLeftElementForManualAttribution();

  const leftIcon = props.onIconClick ? (
    <IconButton
      tooltipTitle="add"
      tooltipPlacement="left"
      onClick={props.onIconClick}
      key={getKey('add-icon', props.cardId)}
      icon={
        <PlusIcon
          sx={{
            ...(props.cardConfig.isResolved ? classes.hiddenIcon : {}),
            ...classes.clickableIcon,
          }}
          aria-label={`add ${packageLabels[0] || ''}`}
        />
      }
    />
  ) : undefined;

  const openResourcesIcon = props.showOpenResourcesIcon ? (
    <IconButton
      tooltipTitle="show resources"
      tooltipPlacement="right"
      onClick={(): void => {
        setShowAssociatedResourcesPopup(true);
      }}
      key={`open-resources-icon-${props.displayPackageInfo.packageName}-${props.displayPackageInfo.packageVersion}`}
      icon={
        <OpenInBrowserIcon
          sx={classes.clickableIcon}
          aria-label={'show resources'}
        />
      }
    />
  ) : undefined;

  return (
    <MuiBox sx={!props.showCheckBox ? classes.multiSelectPackageCard : {}}>
      {showAssociatedResourcesPopup &&
        !Boolean(props.hideContextMenuAndMultiSelect) && (
          <ResourcePathPopup
            closePopup={(): void => setShowAssociatedResourcesPopup(false)}
            attributionIds={displayAttributionIds}
            isExternalAttribution={Boolean(
              props.cardConfig.isExternalAttribution,
            )}
          />
        )}
      <ContextMenu
        menuItems={
          isExternalAttribution
            ? getContextMenuItemsForExternalAttributions()
            : getContextMenuItemsForManualAttributions()
        }
        activation={'onRightClick'}
        onClose={toggleIsContextMenuOpen}
        onOpen={toggleIsContextMenuOpen}
      >
        <ListCard
          text={packageLabels[0] || ''}
          secondLineText={packageLabels[1] || undefined}
          cardConfig={listCardConfig}
          count={props.packageCount}
          onClick={props.onClick}
          leftIcon={leftIcon}
          rightIcons={getRightIcons(
            listCardConfig,
            props.cardId,
            openResourcesIcon,
          )}
          leftElement={leftElement}
          highlighting={highlighting}
        />
      </ContextMenu>
    </MuiBox>
  );
}
