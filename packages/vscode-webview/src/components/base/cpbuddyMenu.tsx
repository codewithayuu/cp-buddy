import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type { PopoverPosition } from '@mui/material/Popover';
import type { SxProps, Theme } from '@mui/material/styles';
import { type MouseEvent, type ReactNode, useState } from 'react';

interface CPBuddyMenuProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  menu: Record<string, () => void>;
}

export const CPBuddyMenu = (props: CPBuddyMenuProps) => {
  const [contextMenu, setContextMenu] = useState<PopoverPosition>();
  return (
    <Box
      onContextMenu={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          left: e.clientX + 2,
          top: e.clientY - 6,
        });
      }}
      style={{ cursor: 'context-menu' }}
      sx={props.sx}
    >
      {props.children}
      <Menu
        open={!!contextMenu}
        onClose={() => setContextMenu(undefined)}
        anchorReference='anchorPosition'
        anchorPosition={contextMenu}
      >
        {Object.entries(props.menu).map(([key, value]) => (
          <MenuItem
            dense
            key={key}
            onClick={() => {
              value();
              setContextMenu(undefined);
            }}
          >
            {key}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
