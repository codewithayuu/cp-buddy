import type { IWebviewBackgroundProblem, IWebviewStressTest, ProblemId } from '@cpbuddy/core';
import BackupIcon from '@mui/icons-material/Backup';
import BoltIcon from '@mui/icons-material/Bolt';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackgroundProblemView } from '@/components/actions/backgroundProblemView';
import { DeleteProblemDialog } from '@/components/actions/deleteProblemDialog';
import { StressTestDialog } from '@/components/actions/stressTestDialog';
import { SubmitDialog } from '@/components/actions/submitDialog';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { RunButtonGroup } from '@/components/runButtonGroup';
import { useConfigState } from '@/context/ConfigContext';
import {
  useProblemDispatch,
  useProblemState,
  useProblemUiDispatch,
} from '@/context/ProblemContext';

interface ProblemActionsProps {
  problemId: ProblemId;
  url: string | null;
  stressTest: IWebviewStressTest;
  hasRunning: boolean;
  backgroundProblems: IWebviewBackgroundProblem[];
}

export const ProblemActions = memo(
  ({ problemId, url, stressTest, hasRunning, backgroundProblems }: ProblemActionsProps) => {
    const { t } = useTranslation();
    const { config } = useConfigState();
    const { submitDialogProblemId } = useProblemState();
    const dispatch = useProblemDispatch();
    const uiDispatch = useProblemUiDispatch();
    const [clickTime, setClickTime] = useState<number[]>([]);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isStressTestDialogOpen, setStressTestDialogOpen] = useState(false);

    useEffect(() => {
      if (clickTime.length === 10 && clickTime[9] - clickTime[0] < 2000) {
        window.easterEgg = !window.easterEgg;
        setClickTime([]);
      }
    }, [clickTime]);
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            position: 'sticky',
            bottom: 24,
            zIndex: 100,
            pointerEvents: 'none', // Allow clicking through the empty space around the dock
            width: '100%',
          }}
        >
          <CPBuddyFlex
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2.5,
              backgroundColor: 'rgba(25, 27, 33, 0.75)',
              backdropFilter: 'blur(16px)',
              padding: '12px 28px',
              borderRadius: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              pointerEvents: 'auto', // Re-enable pointer events for the dock itself
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }
            }}
            onClick={() => setClickTime((times) => [...times, Date.now()].slice(-10))}
          >
            <CPBuddyButton
              icon={SettingsIcon}
              name={t('problemActions.settings', 'Settings')}
              onClick={() => vscode.postMessage({ type: 'openSettings' })}
              larger
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
            
            <CPBuddyButton
              larger
              icon={BoltIcon}
              name={t('runButtonGroup.forceCompile')}
              color='warning'
              onClick={() => dispatch({ type: 'runAllTestcases', problemId, forceCompile: true })}
            />
            <CPBuddyButton
              larger
              name={t('problemActions.stressTest')}
              icon={CompareArrowsIcon}
              onClick={() => setStressTestDialogOpen(true)}
              sx={{
                display: { xs: 'none', sm: 'block' },
                animation: stressTest.isRunning ? 'pulse 1s infinite' : undefined,
              }}
            />
            <CPBuddyButton
              sx={{ display: { xs: 'none', sm: 'block' } }}
              larger
              name={t('problemActions.deleteProblem')}
              icon={DeleteForeverIcon}
              color='error'
              onClick={() => setDeleteDialogOpen(true)}
            />
            {!!window.easterEgg && <div title={t('problemActions.easterEgg')}>🐰</div>}
            
            <BackgroundProblemView backgroundProblems={backgroundProblems} />
          </CPBuddyFlex>
        </Box>

        <DeleteProblemDialog
          open={isDeleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={() => {
            dispatch({ type: 'deleteProblem', problemId });
            setDeleteDialogOpen(false);
          }}
        />

        <SubmitDialog
          open={submitDialogProblemId === problemId}
          onClose={() => uiDispatch({ type: 'closeSubmitDialog' })}
          onConfirm={() => {
            dispatch({ type: 'submit', problemId });
            uiDispatch({ type: 'closeSubmitDialog' });
          }}
        />

        <StressTestDialog
          open={isStressTestDialogOpen}
          onClose={() => setStressTestDialogOpen(false)}
          problemId={problemId}
          stressTest={stressTest}
        />
      </>
    );
  },
);
