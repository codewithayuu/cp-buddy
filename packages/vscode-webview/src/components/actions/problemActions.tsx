import type { IWebviewBackgroundProblem, IWebviewStressTest, ProblemId } from '@cpbuddy/core';
import BackupIcon from '@mui/icons-material/Backup';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import SettingsIcon from '@mui/icons-material/Settings';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackgroundProblemView } from '@/components/actions/backgroundProblemView';
import { DeleteProblemDialog } from '@/components/actions/deleteProblemDialog';
import { StressTestDialog } from '@/components/actions/stressTestDialog';
import { SubmitDialog } from '@/components/actions/submitDialog';
import { HelpButton } from '@/components/actions/support';
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
        <CPBuddyFlex
          smallGap
          sx={{ justifyContent: 'center' }}
          onClick={() => setClickTime((times) => [...times, Date.now()].slice(-10))}
        >
          <HelpButton />
          <CPBuddyButton
            icon={SettingsIcon}
            name={t('problemActions.settings', 'Settings')}
            onClick={() => vscode.postMessage({ type: 'openSettings' })}
            larger
            sx={{ display: { xs: 'none', md: 'block' } }}
          />
          <CPBuddyFlex smallGap sx={{ flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            {hasRunning ? (
              <CPBuddyButton
                larger
                name={t('problemActions.stopTestcases')}
                icon={PlaylistRemoveIcon}
                color='warning'
                onClick={() =>
                  dispatch({
                    type: 'stopTestcases',
                    problemId,
                  })
                }
              />
            ) : (
              <RunButtonGroup
                larger
                icon={PlaylistPlayIcon}
                name={t('problemActions.runAllTestcases')}
                color='success'
                onRun={(forceCompile) =>
                  dispatch({ type: 'runAllTestcases', problemId, forceCompile })
                }
              />
            )}
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
            {!!url && (
              <CPBuddyButton
                larger
                name={t('problemActions.submit')}
                icon={BackupIcon}
                color='secondary'
                onClick={() => {
                  if (config.confirmSubmit) uiDispatch({ type: 'openSubmitDialog', problemId });
                  else dispatch({ type: 'submit', problemId });
                }}
              />
            )}
            <CPBuddyButton
              sx={{ display: { xs: 'none', sm: 'block' } }}
              larger
              name={t('problemActions.deleteProblem')}
              icon={DeleteForeverIcon}
              color='error'
              onClick={() => setDeleteDialogOpen(true)}
            />
            {!!window.easterEgg && <div title={t('problemActions.easterEgg')}>🐰</div>}
          </CPBuddyFlex>
          <BackgroundProblemView backgroundProblems={backgroundProblems} />
        </CPBuddyFlex>

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
