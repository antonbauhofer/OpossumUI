// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react';
import { noop } from 'lodash';

import { ButtonText } from '../../../enums/enums';
import { doNothing } from '../../../util/do-nothing';
import { ContextMenu, ContextMenuItem } from '../ContextMenu';

const onClickMock = jest.fn();
const testMenuItems: Array<ContextMenuItem> = [
  {
    buttonText: ButtonText.Save,
    disabled: false,
    onClick: onClickMock,
  },
  {
    buttonText: ButtonText.SaveGlobally,
    disabled: false,
    onClick: doNothing,
    hidden: true,
  },
];

function expectContextMenuIsNotShown(): void {
  expect(screen.queryByText(ButtonText.Save)).not.toBeInTheDocument();
  expect(screen.queryByText(ButtonText.SaveGlobally)).not.toBeInTheDocument();
}

function expectContextMenuIsShown(): void {
  expect(screen.getByText(ButtonText.Save)).toBeInTheDocument();
  expect(screen.queryByText(ButtonText.SaveGlobally)).not.toBeInTheDocument();
}

describe('The ContextMenu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders and handles left clicks correctly', () => {
    const testElementText = 'Test Element';
    render(
      <ContextMenu menuItems={testMenuItems} activation={'onLeftClick'}>
        <p>{testElementText}</p>
      </ContextMenu>,
    );

    expectContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    expectContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    expectContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders and handles right clicks correctly', () => {
    const testElementText = 'Test Element';
    render(
      <ContextMenu menuItems={testMenuItems} activation={'onRightClick'}>
        <p>{testElementText}</p>
      </ContextMenu>,
    );

    expectContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    expectContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    expectContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders and handles left clicks correctly for both activated', () => {
    const testElementText = 'Test Element';
    render(
      <ContextMenu menuItems={testMenuItems} activation={'both'}>
        <p>{testElementText}</p>
      </ContextMenu>,
    );

    expectContextMenuIsNotShown();

    fireEvent.click(screen.getByText(testElementText));
    expectContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders and handles right clicks correctly for both clicks activated', () => {
    const testElementText = 'Test Element';
    render(
      <ContextMenu menuItems={testMenuItems} activation={'both'}>
        <p>{testElementText}</p>
      </ContextMenu>,
    );

    expectContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    expectContextMenuIsShown();

    fireEvent.click(screen.getByText(ButtonText.Save));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders and calls onOpen and onClose correctly', () => {
    const testElementText = 'Test Element';
    const onCloseMock = jest.fn();
    const onOpenMock = jest.fn();
    render(
      <ContextMenu
        menuItems={testMenuItems}
        activation={'both'}
        onClose={onCloseMock}
        onOpen={onOpenMock}
      >
        <p>{testElementText}</p>
      </ContextMenu>,
    );

    expectContextMenuIsNotShown();

    fireEvent.contextMenu(screen.getByText(testElementText));
    expectContextMenuIsShown();
    expect(onOpenMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText(ButtonText.Save));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled when all menu items are disabled', () => {
    const menuItem: ContextMenuItem = {
      buttonText: ButtonText.Save,
      disabled: true,
      onClick: noop,
      hidden: false,
    };
    const trigger = 'Test Element';
    render(
      <ContextMenu menuItems={[menuItem]} activation={'onLeftClick'}>
        <p>{trigger}</p>
      </ContextMenu>,
    );

    fireEvent.click(screen.getByText(trigger));

    expect(screen.queryByText(menuItem.buttonText)).not.toBeInTheDocument();
  });

  it('only displays visible menu items', () => {
    const visibleMenuItem: ContextMenuItem = {
      buttonText: ButtonText.Save,
      onClick: noop,
      hidden: false,
    };
    const invisibleMenuItem: ContextMenuItem = {
      buttonText: ButtonText.Apply,
      onClick: noop,
      hidden: true,
    };
    const trigger = 'Test Element';
    render(
      <ContextMenu
        menuItems={[visibleMenuItem, invisibleMenuItem]}
        activation={'onLeftClick'}
      >
        <p>{trigger}</p>
      </ContextMenu>,
    );

    fireEvent.click(screen.getByText(trigger));

    expect(screen.getByText(visibleMenuItem.buttonText)).toBeInTheDocument();
    expect(
      screen.queryByText(invisibleMenuItem.buttonText),
    ).not.toBeInTheDocument();
  });
});
