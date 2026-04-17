import type { IWebviewStressTest, ProblemId } from '@cpbuddy/core';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SrcFileSelect } from '@/components/actions/srcFileSelect';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { RunButtonGroup } from '@/components/runButtonGroup';
import { useProblemDispatch } from '@/context/ProblemContext';

interface StressTestDialogProps {
  open: boolean;
  onClose: () => void;
  problemId: ProblemId;
  stressTest: IWebviewStressTest;
}

export const StressTestDialog = memo(
  ({ open, onClose, problemId, stressTest }: StressTestDialogProps) => {
    const { t } = useTranslation();
    const dispatch = useProblemDispatch();

    return (
      <Dialog fullWidth maxWidth={false} open={open} onClose={onClose}>
        <DialogTitle>{t('problemActions.stressTestDialog.title')}</DialogTitle>
        <CPBuddyButton
          name={t('problemActions.stressTestDialog.close')}
          onClick={onClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
          icon={CloseIcon}
        />
        <DialogContent>
          <CPBuddyFlex column>
            <SrcFileSelect
              label={t('problemActions.stressTestDialog.generator')}
              file={stressTest.generator}
              problemId={problemId}
              fileType='generator'
            />
            <SrcFileSelect
              label={t('problemActions.stressTestDialog.bruteForce')}
              file={stressTest.bruteForce}
              problemId={problemId}
              fileType='bruteForce'
            />
            <CPBuddyFlex>{stressTest.msg}</CPBuddyFlex>
            {stressTest.isRunning ? (
              <CPBuddyButton
                name={t('problemActions.stressTestDialog.stop')}
                onClick={() =>
                  dispatch({
                    type: 'stopStressTest',
                    problemId,
                  })
                }
                icon={StopCircleIcon}
                color='warning'
              />
            ) : (
              <RunButtonGroup
                icon={PlayCircleIcon}
                name={t('problemActions.stressTestDialog.run')}
                color='success'
                disabled={!stressTest.generator || !stressTest.bruteForce}
                onRun={(forceCompile) => {
                  dispatch({ type: 'startStressTest', problemId, forceCompile });
                }}
              />
            )}
          </CPBuddyFlex>
        </DialogContent>
      </Dialog>
    );
  },
);
