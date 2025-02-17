// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import MuiBox from '@mui/material/Box';
import { compact, uniq } from 'lodash';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { clickableIcon, disabledIcon } from '../../shared-styles';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setExpandedIds } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { getParents } from '../../state/helpers/get-parents';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { usePrevious } from '../../util/use-previous';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';
import { IconButton } from '../IconButton/IconButton';

const classes = {
  root: {
    padding: '0 6px',
    display: 'flex',
    alignItems: 'center',
    minHeight: '24px',
  },
};

export function PathBar(): ReactElement | null {
  const resourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);
  const dispatch = useAppDispatch();
  const [history, setHistory] = useState({
    stack: [resourceId],
    activeIndex: 0,
  });
  const activeResourceId = history.stack[history.activeIndex] as
    | string
    | undefined;
  const previousActiveResourceId = usePrevious(activeResourceId);
  const isGoBackEnabled = !!history.activeIndex;
  const isGoForwardEnabled = history.activeIndex !== history.stack.length - 1;

  const pathElements = compact(resourceId.split('/'));

  const cmdOrCtrl = useMemo(
    () => (window.navigator.platform.match(/^Mac/) ? '⌘' : 'Ctrl'),
    [],
  );

  const handleGoBack = useCallback((): void => {
    if (history.activeIndex > 0) {
      setHistory((prev) => ({ ...prev, activeIndex: prev.activeIndex - 1 }));
      dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup(
          history.stack[history.activeIndex - 1],
        ),
      );
    }
  }, [dispatch, history.activeIndex, history.stack]);

  const handleGoForward = useCallback((): void => {
    if (history.activeIndex < history.stack.length - 1) {
      setHistory((prev) => ({ ...prev, activeIndex: prev.activeIndex + 1 }));
      dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup(
          history.stack[history.activeIndex + 1],
        ),
      );
    }
  }, [dispatch, history.activeIndex, history.stack]);

  useHotkeys('mod+ArrowLeft', handleGoBack, { enabled: isGoBackEnabled }, [
    history.activeIndex,
    history,
  ]);

  useHotkeys(
    'mod+ArrowRight',
    handleGoForward,
    { enabled: isGoForwardEnabled },
    [history.activeIndex, history],
  );

  useEffect(() => {
    if (resourceId && activeResourceId !== resourceId) {
      setHistory((prev) => ({
        stack: prev.stack.slice(0, prev.activeIndex + 1).concat(resourceId),
        activeIndex: prev.activeIndex + 1,
      }));
    }
  }, [activeResourceId, resourceId]);

  useEffect(() => {
    if (
      activeResourceId !== previousActiveResourceId &&
      activeResourceId &&
      !expandedIds.includes(activeResourceId)
    ) {
      dispatch(
        setExpandedIds(
          uniq([
            ...expandedIds,
            ...getParents(activeResourceId),
            activeResourceId,
          ]),
        ),
      );
    }
  }, [activeResourceId, dispatch, expandedIds, previousActiveResourceId]);

  return (
    <MuiBox aria-label={'path bar'} sx={classes.root}>
      {renderActions()}
      {renderBreadcrumbs()}
    </MuiBox>
  );

  function renderActions(): ReactElement {
    return (
      <>
        <IconButton
          icon={
            <ArrowBackIcon
              aria-label={'go back'}
              sx={isGoBackEnabled ? clickableIcon : disabledIcon}
            />
          }
          onClick={handleGoBack}
          tooltipPlacement={'left'}
          tooltipTitle={`Go back (${cmdOrCtrl} + Left arrow)`}
          disabled={!isGoBackEnabled}
        />
        <IconButton
          icon={
            <ArrowForwardIcon
              aria-label={'go forward'}
              sx={isGoForwardEnabled ? clickableIcon : disabledIcon}
            />
          }
          onClick={handleGoForward}
          tooltipPlacement={'left'}
          tooltipTitle={`Go forward (${cmdOrCtrl} + Right arrow)`}
          disabled={!isGoForwardEnabled}
        />
        <IconButton
          icon={<ContentCopyIcon aria-label={'copy path'} sx={clickableIcon} />}
          onClick={(): Promise<void> =>
            navigator.clipboard.writeText(pathElements.join('/'))
          }
          tooltipPlacement={'left'}
          tooltipTitle={'Copy path to clipboard'}
          aria-label={'copy path'}
        />
        <GoToLinkButton />
      </>
    );
  }

  function renderBreadcrumbs(): ReactElement {
    const getResourceId = (resourceName: string): string => {
      const elements = resourceId.split('/');
      return elements
        .slice(0, elements.indexOf(resourceName) + 1)
        .concat('')
        .join('/');
    };

    return (
      <Breadcrumbs
        idsToDisplayValues={pathElements.map((element) => [element, element])}
        maxItems={5}
        onClick={(resourceName): void =>
          dispatch(
            setSelectedResourceIdOrOpenUnsavedPopup(
              getResourceId(resourceName),
            ),
          )
        }
        key={resourceId}
        selectedId={pathElements[pathElements.length - 1]}
      />
    );
  }
}
