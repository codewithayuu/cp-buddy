import { t } from '@b/i18n';
import { onMessage, type StatusResponse, sendMessage } from '@b/messaging';
import { enableClock, enableAmoledTheme, enableLeetcodeAmoledTheme, enableLeetcodeFastIO, enableProblemTimer, hideTopicTags, showUserHoverCard, showContestDate, enableSpoof, spoofTarget, spoofAlias, enableLiveVerdict, showLiveSolves, customLogoData, customLogoType, openLinksInNewTab, problemRatingsData, enableCPBuddySubmit, showProfileAnalytics, enableGodMode, godModeTarget, godModeRating, godModeMaxRating, godModeProblems, godModeStreak, godModeRegistered, godModeContests } from '@b/settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

const theme = createTheme({ palette: { mode: 'dark' } });

interface SubmitLog {
  submissionId: string;
  success: boolean;
  message: string;
  timestamp: number;
}

const PopupInner = () => {
  const [status, setStatus] = useState<StatusResponse>({
    connected: false,
    isActive: false,
    port: 27121,
  });
  const [portInput, setPortInput] = useState('27121');
  const [logs, setLogs] = useState<SubmitLog[]>([]);

  const [amoledEnabled, setAmoledEnabled] = useState(false);
  const [leetcodeAmoledEnabled, setLeetcodeAmoledEnabled] = useState(true);
  const [leetcodeFastIOEnabled, setLeetcodeFastIOEnabled] = useState(true);
  const [clockEnabled, setClockEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [hideTagsEnabled, setHideTagsEnabled] = useState(false);
  const [hoverCardEnabled, setHoverCardEnabled] = useState(false);
  const [contestDateEnabled, setContestDateEnabled] = useState(false);
  const [liveVerdictEnabled, setLiveVerdictEnabled] = useState(false);
  const [liveSolvesEnabled, setLiveSolvesEnabled] = useState(false);
  const [newTabEnabled, setNewTabEnabled] = useState(false);
  const [spoofEnabled, setSpoofEnabled] = useState(false);
  const [targetName, setTargetName] = useState('tourist');
  const [aliasName, setAliasName] = useState('moasis');
  const [logoName, setLogoName] = useState('');
  const [ratingsCount, setRatingsCount] = useState(0);
  const [buddySubmitEnabled, setBuddySubmitEnabled] = useState(true);
  const [profileAnalyticsEnabled, setProfileAnalyticsEnabled] = useState(true);

  // God Mode State
  const [godModeEnabled, setGodModeEnabled] = useState(false);
  const [gmTarget, setGmTarget] = useState('');
  const [gmRating, setGmRating] = useState(3000);
  const [gmMaxRating, setGmMaxRating] = useState(3200);
  const [gmProblems, setGmProblems] = useState(2000);
  const [gmStreak, setGmStreak] = useState(365);
  const [gmRegistered, setGmRegistered] = useState('10 years');
  const [gmContests, setGmContests] = useState(100);

  useEffect(() => {
    sendMessage('getStatus', undefined).then((res) => {
      setStatus(res);
      setPortInput(String(res.port));
    });

    enableAmoledTheme.getValue().then(setAmoledEnabled);
    enableLeetcodeAmoledTheme.getValue().then(setLeetcodeAmoledEnabled);
    enableLeetcodeFastIO.getValue().then(setLeetcodeFastIOEnabled);
    enableClock.getValue().then(setClockEnabled);
    enableProblemTimer.getValue().then(setTimerEnabled);
    hideTopicTags.getValue().then(setHideTagsEnabled);
    showUserHoverCard.getValue().then(setHoverCardEnabled);
    showContestDate.getValue().then(setContestDateEnabled);
    enableLiveVerdict.getValue().then(setLiveVerdictEnabled);
    showLiveSolves.getValue().then(setLiveSolvesEnabled);
    openLinksInNewTab.getValue().then(setNewTabEnabled);
    enableSpoof.getValue().then(setSpoofEnabled);
    spoofTarget.getValue().then(setTargetName);
    spoofAlias.getValue().then(setAliasName);
    customLogoType.getValue().then(type => {
      if (type) setLogoName('Custom Logo Set');
    });
    problemRatingsData.getValue().then(data => {
      setRatingsCount(Object.keys(data || {}).length);
    });
    enableCPBuddySubmit.getValue().then(setBuddySubmitEnabled);
    showProfileAnalytics.getValue().then(setProfileAnalyticsEnabled);

    // God mode init
    enableGodMode.getValue().then(setGodModeEnabled);
    godModeTarget.getValue().then(setGmTarget);
    godModeRating.getValue().then(setGmRating);
    godModeMaxRating.getValue().then(setGmMaxRating);
    godModeProblems.getValue().then(setGmProblems);
    godModeStreak.getValue().then(setGmStreak);
    godModeRegistered.getValue().then(setGmRegistered);
    godModeContests.getValue().then(setGmContests);

    const removeStatusUpdate = onMessage('statusUpdate', ({ data }) => {
      setStatus({ connected: data.connected, isActive: data.isActive, port: data.port });
    });
    const removeSubmitResult = onMessage('submitResult', ({ data }) => {
      setLogs((prev) =>
        [
          {
            submissionId: data.submissionId,
            success: data.success,
            message: data.message,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 20),
      );
    });

    return () => {
      removeStatusUpdate();
      removeSubmitResult();
    };
  }, []);

  const handleConnect = useCallback(() => {
    sendMessage('connect', undefined);
  }, []);
  const handleDisconnect = useCallback(() => {
    sendMessage('disconnect', undefined);
  }, []);
  const handleActivate = useCallback(() => {
    sendMessage('setActive', undefined);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = event.target?.result as string;
        customLogoData.setValue(data);
        customLogoType.setValue(file.type.startsWith('video') ? 'video' : 'image');
        setLogoName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = () => {
    customLogoData.setValue('');
    customLogoType.setValue('');
    setLogoName('');
  };

  const handleRatingsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const data = JSON.parse(jsonString);
          problemRatingsData.setValue(data);
          setRatingsCount(Object.keys(data).length);
        } catch (error) {
          console.error("Failed to parse JSON file", error);
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRatingsExport = async () => {
    const data = await problemRatingsData.getValue();
    const jsonString = JSON.stringify(data || {}, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpbuddy_ratings_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearRatings = () => {
    problemRatingsData.setValue({});
    setRatingsCount(0);
  };

  const handleSetPort = useCallback(() => {
    const port = Number.parseInt(portInput, 10);
    if (port > 0 && port < 65536) {
      sendMessage('setPort', { port });
    }
  }, [portInput]);

  return (
    <Box sx={{ width: 500, p: 2 }}>
      <Box sx={{ pb: 2 }}>
        <Typography variant='h6'>
          {t('appTitle')} - Settings
          <Chip
            label={
              status.connected
                ? status.isActive
                  ? t('statusConnected')
                : t('statusInactive')
                : t('statusDisconnected')
            }
            color={status.connected ? (status.isActive ? 'success' : 'warning') : 'error'}
            size='small'
            variant='outlined'
            sx={{ marginLeft: 2 }}
          />
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 'bold' }}>Features</Typography>
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={clockEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setClockEnabled(val);
                  enableClock.setValue(val);
                }}
              />
            }
            label="Show Top Middle Clock"
          />
          <FormControlLabel
            control={
              <Switch
                checked={amoledEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAmoledEnabled(val);
                  enableAmoledTheme.setValue(val);
                }}
              />
            }
            label="Enable Codeforces AMOLED Dark Theme"
          />
          <FormControlLabel
            control={
              <Switch
                checked={leetcodeAmoledEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setLeetcodeAmoledEnabled(val);
                  enableLeetcodeAmoledTheme.setValue(val);
                }}
              />
            }
            label="Enable LeetCode AMOLED Blue Theme"
          />
          <FormControlLabel
            control={
              <Switch
                checked={leetcodeFastIOEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setLeetcodeFastIOEnabled(val);
                  enableLeetcodeFastIO.setValue(val);
                }}
              />
            }
            label="Enable LeetCode C++ Fast I/O Auto-Injector"
          />
          <FormControlLabel
            control={
              <Switch
                checked={timerEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setTimerEnabled(val);
                  enableProblemTimer.setValue(val);
                }}
              />
            }
            label="Enable Codeforces Problem Timer"
          />
          <FormControlLabel
            control={
              <Switch
                checked={hideTagsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setHideTagsEnabled(val);
                  hideTopicTags.setValue(val);
                }}
              />
            }
            label="Hide Codeforces Topic Tags"
          />
          <FormControlLabel
            control={
              <Switch
                checked={hoverCardEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setHoverCardEnabled(val);
                  showUserHoverCard.setValue(val);
                }}
              />
            }
            label="Enable Codeforces User Hover Card"
          />
          <FormControlLabel
            control={
              <Switch
                checked={contestDateEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setContestDateEnabled(val);
                  showContestDate.setValue(val);
                }}
              />
            }
            label="Show Contest Date in Sidebar"
          />
          <FormControlLabel
            control={
              <Switch
                checked={liveVerdictEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setLiveVerdictEnabled(val);
                  enableLiveVerdict.setValue(val);
                }}
              />
            }
            label="Enable Live Verdict & Queue Estimator"
          />
          <FormControlLabel
            control={
              <Switch
                checked={liveSolvesEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setLiveSolvesEnabled(val);
                  showLiveSolves.setValue(val);
                }}
              />
            }
            label="Show Live Solves in Sidebar (Contests)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={spoofEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setSpoofEnabled(val);
                  enableSpoof.setValue(val);
                }}
              />
            }
            label="Enable Username Spoofing (Hide My Username)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newTabEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNewTabEnabled(val);
                  openLinksInNewTab.setValue(val);
                }}
              />
            }
            label="Open All Links in New Tab"
          />
          <FormControlLabel
            control={
              <Switch
                checked={buddySubmitEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setBuddySubmitEnabled(val);
                  enableCPBuddySubmit.setValue(val);
                }}
              />
            }
            label="Enable CPBuddy Core Feature (Send to VSCode/Sublime)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={profileAnalyticsEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setProfileAnalyticsEnabled(val);
                  showProfileAnalytics.setValue(val);
                }}
              />
            }
            label="Show CPBuddy Profile Analytics & Rating Heatmap"
          />
          {spoofEnabled && (
            <Stack direction="row" spacing={2} sx={{ mt: 1, ml: 4 }}>
              <TextField 
                size="small" 
                label="Real Username" 
                value={targetName}
                onChange={(e) => {
                  setTargetName(e.target.value);
                  spoofTarget.setValue(e.target.value);
                }}
              />
              <TextField 
                size="small" 
                label="Spoof Alias" 
                value={aliasName}
                onChange={(e) => {
                  setAliasName(e.target.value);
                  spoofAlias.setValue(e.target.value);
                }}
              />
            </Stack>
          )}
          
          <Divider sx={{ my: 1 }} />
          <Typography variant='subtitle2' sx={{ mb: 1, color: '#f50057', fontWeight: 'bold' }}>God Mode (Profile Spoofing)</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={godModeEnabled}
                onChange={(e) => {
                  const val = e.target.checked;
                  setGodModeEnabled(val);
                  enableGodMode.setValue(val);
                }}
                color="secondary"
              />
            }
            label="Enable God Mode (Advanced Profile Spoofing)"
          />
          {godModeEnabled && (
            <Stack spacing={2} sx={{ mt: 1, ml: 4, mb: 1 }}>
              <TextField 
                size="small" 
                label="Target Handle (Required)" 
                value={gmTarget}
                onChange={(e) => {
                  setGmTarget(e.target.value);
                  godModeTarget.setValue(e.target.value);
                }}
                helperText="God Mode only activates on this profile"
              />
              <Stack direction="row" spacing={2}>
                <TextField 
                  size="small" label="Current Rating" type="number" value={gmRating}
                  onChange={(e) => { setGmRating(Number(e.target.value)); godModeRating.setValue(Number(e.target.value)); }}
                />
                <TextField 
                  size="small" label="Max Rating" type="number" value={gmMaxRating}
                  onChange={(e) => { setGmMaxRating(Number(e.target.value)); godModeMaxRating.setValue(Number(e.target.value)); }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField 
                  size="small" label="Total Solved" type="number" value={gmProblems}
                  onChange={(e) => { setGmProblems(Number(e.target.value)); godModeProblems.setValue(Number(e.target.value)); }}
                />
                <TextField 
                  size="small" label="Max Streak (Days)" type="number" value={gmStreak}
                  onChange={(e) => { setGmStreak(Number(e.target.value)); godModeStreak.setValue(Number(e.target.value)); }}
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField 
                  size="small" label="Registered (e.g. 10 years)" value={gmRegistered}
                  onChange={(e) => { setGmRegistered(e.target.value); godModeRegistered.setValue(e.target.value); }}
                />
                <TextField 
                  size="small" label="Total Contests" type="number" value={gmContests}
                  onChange={(e) => { setGmContests(Number(e.target.value)); godModeContests.setValue(Number(e.target.value)); }}
                />
              </Stack>
            </Stack>
          )}

          <Divider sx={{ my: 1 }} />
          <Typography variant='subtitle2' sx={{ mb: 1 }}>Custom Codeforces Logo</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" component="label" size="small">
              Upload Logo (Image/GIF/MP4)
              <input type="file" hidden accept="image/*,video/mp4" onChange={handleLogoUpload} />
            </Button>
            {logoName && (
              <>
                <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>{logoName}</Typography>
                <Button size="small" color="error" onClick={handleClearLogo}>Clear</Button>
              </>
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />
          <Typography variant='subtitle2' sx={{ mb: 1 }}>Problem Ratings & Info</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" component="label" size="small">
              Upload JSON
              <input type="file" hidden accept=".json" onChange={handleRatingsUpload} />
            </Button>
            <Button variant="outlined" size="small" onClick={handleRatingsExport} disabled={ratingsCount === 0}>
              Export JSON
            </Button>
            {ratingsCount > 0 && (
              <>
                <Typography variant="caption" noWrap>{ratingsCount} problems loaded</Typography>
                <Button size="small" color="error" onClick={handleClearRatings}>Clear</Button>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {buddySubmitEnabled && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 'bold' }}>Connection</Typography>
        <Stack direction='row' sx={{ gap: 1 }}>
          <TextField
            label={t('labelPort')}
            type='number'
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            size='small'
            slotProps={{ htmlInput: { min: 1, max: 65535 } }}
            sx={{ width: 110 }}
          />
          <Button variant='outlined' onClick={handleSetPort}>
            {t('btnSet')}
          </Button>
        </Stack>

        <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
          {status.connected ? (
            <Button variant='contained' color='error' size='small' onClick={handleDisconnect}>
              {t('btnDisconnect')}
            </Button>
          ) : (
            <Button variant='contained' color='primary' size='small' onClick={handleConnect}>
              {t('btnConnect')}
            </Button>
          )}
          {status.connected && !status.isActive && (
            <Button variant='contained' color='warning' size='small' onClick={handleActivate}>
              {t('btnActivate')}
            </Button>
          )}
        </Stack>
      </Box>

      {logs.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
            {t('recentSubmissions')}
          </Typography>
          <List dense disablePadding>
            {logs.map((log) => (
              <ListItem
                key={`${log.submissionId}-${log.timestamp}`}
                disablePadding
                sx={{ py: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {log.success ? (
                    <CheckCircleIcon fontSize='small' color='success' />
                  ) : (
                    <ErrorIcon fontSize='small' color='error' />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={log.message}
                  slotProps={{
                    primary: {
                      variant: 'body2',
                      noWrap: true,
                      title: log.message,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
      </>
      )}
    </Box>
  );
};

export const Popup = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <PopupInner />
  </ThemeProvider>
);
