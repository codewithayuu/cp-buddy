import Tooltip, { type TooltipProps } from '@mui/material/Tooltip';

interface CPBuddyTooltipProps extends TooltipProps {}

export const CPBuddyTooltip = (props: CPBuddyTooltipProps) => {
  return (
    <Tooltip disableInteractive followCursor {...props}>
      {props.children}
    </Tooltip>
  );
};
