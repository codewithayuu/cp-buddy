import BugReportIcon from '@mui/icons-material/BugReport';
import DescriptionIcon from '@mui/icons-material/Description';
import ExtensionIcon from '@mui/icons-material/Extension';
import GitHubIcon from '@mui/icons-material/GitHub';
import GroupIcon from '@mui/icons-material/Group';
import HelpIcon from '@mui/icons-material/Help';
import { Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';

const openLink = (url: string) => () => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const HelpButton = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <CPBuddyButton
        ref={anchorRef}
        icon={HelpIcon}
        name={t('support.help')}
        onClick={handleClick}
        larger
        sx={{ display: { xs: 'none', md: 'block' } }}
      />

      <Menu anchorEl={anchorRef.current} open={open} onClose={handleClose}>
        <MenuItem onClick={openLink('https://github.com/cpbuddy')}>
          <ListItemIcon>
            <GitHubIcon fontSize='small' />
          </ListItemIcon>
          {t('support.github')}
        </MenuItem>
        <MenuItem onClick={openLink('https://github.com/cpbuddy/issues')}>
          <ListItemIcon>
            <BugReportIcon fontSize='small' />
          </ListItemIcon>
          {t('support.feedback')}
        </MenuItem>
        <MenuItem onClick={openLink('https://deepwiki.com/cpbuddy')}>
          <ListItemIcon>
            <DescriptionIcon fontSize='small' />
          </ListItemIcon>
          {t('support.docs')}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={openLink(
            'https://microsoftedge.microsoft.com/addons/detail/cphng-submit/hfpfdaggmljfccmnfljldojbgfhpfomb',
          )}
        >
          <ListItemIcon>
            <ExtensionIcon fontSize='small' />
          </ListItemIcon>
          {t('support.edgeAddon')}
        </MenuItem>
        <MenuItem onClick={openLink('https://addons.mozilla.org/firefox/addon/cpbuddy-submit/')}>
          <ListItemIcon>
            <ExtensionIcon fontSize='small' />
          </ListItemIcon>
          {t('support.firefoxAddon')}
        </MenuItem>
        <Divider />
        <MenuItem onClick={openLink('https://qm.qq.com/q/pXStina3jU')}>
          <ListItemIcon>
            <GroupIcon fontSize='small' />
          </ListItemIcon>
          {t('support.joinQQ')}
        </MenuItem>
      </Menu>
    </>
  );
};
