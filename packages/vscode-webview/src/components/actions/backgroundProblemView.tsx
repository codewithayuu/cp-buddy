import type { IWebviewBackgroundProblem } from '@cpbuddy/core';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyLink } from '@/components/base/cpbuddyLink';
import { CPBuddyText } from '@/components/base/cpbuddyText';
import { CPBuddyTooltip } from '@/components/base/cpbuddyTooltip';
import { useProblemDispatch } from '@/context/ProblemContext';

interface BackgroundProblemViewProps {
  backgroundProblems: IWebviewBackgroundProblem[];
}

export const BackgroundProblemView = memo(({ backgroundProblems }: BackgroundProblemViewProps) => {
  const { t } = useTranslation();
  const dispatch = useProblemDispatch();
  const [open, setOpen] = useState(false);

  if (backgroundProblems.length === 0) return null;

  return (
    <>
      <CPBuddyTooltip title={t('backgroundProblemView.message')}>
        <Chip
          icon={<TaskAltIcon />}
          label={backgroundProblems.length}
          size='small'
          variant='outlined'
          onClick={() => {
            setOpen(true);
          }}
          sx={{ display: { xs: 'none', md: 'block' } }}
        />
      </CPBuddyTooltip>
      <Dialog
        fullWidth
        maxWidth={false}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle>{t('backgroundProblemView.title')}</DialogTitle>
        <DialogContent>
          {backgroundProblems.length ? (
            <CPBuddyFlex>
              {backgroundProblems.map((bgProblem) => (
                <CPBuddyLink
                  key={bgProblem.srcPath}
                  name={bgProblem.srcPath}
                  onClick={() => {
                    dispatch({
                      type: 'openFile',
                      path: bgProblem.srcPath,
                    });
                    setOpen(false);
                  }}
                >
                  {bgProblem.name}
                </CPBuddyLink>
              ))}
            </CPBuddyFlex>
          ) : (
            <CPBuddyText>{t('backgroundProblemView.empty')}</CPBuddyText>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
