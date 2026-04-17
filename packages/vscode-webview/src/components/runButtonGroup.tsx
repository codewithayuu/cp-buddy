import BoltIcon from '@mui/icons-material/Bolt';
import FastForwardIcon from '@mui/icons-material/FastForward';
import { type IconButtonProps, Popover } from '@mui/material';
import Box from '@mui/material/Box';
import type SvgIcon from '@mui/material/SvgIcon';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { getCompile } from '@/utils';

interface RunButtonGroupProps {
  icon: typeof SvgIcon;
  name: string;
  larger?: boolean;
  color: IconButtonProps['color'];
  disabled?: boolean;
  onRun: (forceCompile: boolean | null) => void;
}

export const RunButtonGroup = ({
  icon,
  name,
  larger,
  color,
  disabled,
  onRun,
}: RunButtonGroupProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const actions = [
    {
      icon: BoltIcon,
      label: t('runButtonGroup.forceCompile'),
      color: 'warning' as const,
      bgColor: 'warning.main',
      onClick: () => onRun(true),
    },
    {
      icon: FastForwardIcon,
      label: t('runButtonGroup.skipCompile'),
      color: 'info' as const,
      bgColor: 'info.main',
      onClick: () => onRun(false),
    },
  ];

  return (
    <Box
      ref={(el: HTMLDivElement | null) => setAnchorEl(el)}
      onMouseEnter={() => {
        if (!disabled) setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
      sx={{ display: 'inline-flex' }}
    >
      <CPBuddyButton
        icon={icon}
        name={name}
        larger={larger}
        color={color}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
          onRun(getCompile(e));
        }}
      />
      <Popover
        disableRestoreFocus
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{ pointerEvents: 'none' }}
        slotProps={{ paper: { sx: { pointerEvents: 'auto' } } }}
      >
        <CPBuddyFlex>
          {actions.map((action) => (
            <CPBuddyButton
              key={action.label}
              icon={action.icon}
              name={action.label}
              larger={larger}
              color={action.color}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                action.onClick();
              }}
            />
          ))}
        </CPBuddyFlex>
      </Popover>
    </Box>
  );
};
