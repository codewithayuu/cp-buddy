import type { ProblemId } from '@cpbuddy/core';
import CloseIcon from '@mui/icons-material/Close';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyLink } from '@/components/base/cpbuddyLink';
import { useProblemDispatch } from '@/context/ProblemContext';

interface SrcFileSelectProps {
  label: string;
  file: { path: string; base: string } | null;
  problemId: ProblemId;
  fileType: 'generator' | 'bruteForce';
}

export const SrcFileSelect = memo(({ label, file, problemId, fileType }: SrcFileSelectProps) => {
  const { t } = useTranslation();
  const dispatch = useProblemDispatch();

  return (
    <CPBuddyFlex>
      <Typography>{label}</Typography>
      {file ? (
        <>
          <CPBuddyLink
            name={file.path}
            onClick={() => dispatch({ type: 'openFile', path: file.path })}
          >
            {file.base}
          </CPBuddyLink>
          <CPBuddyButton
            icon={CloseIcon}
            onClick={() =>
              dispatch({
                type: 'removeSrcFile',
                problemId,
                fileType,
              })
            }
            name={
              fileType === 'generator'
                ? t('problemActions.stressTestDialog.button.removeGenerator')
                : t('problemActions.stressTestDialog.button.removeBruteForce')
            }
          />
        </>
      ) : (
        <CPBuddyButton
          icon={FileOpenIcon}
          onClick={() =>
            dispatch({
              type: 'chooseSrcFile',
              problemId,
              fileType,
            })
          }
          name={
            fileType === 'generator'
              ? t('problemActions.stressTestDialog.button.chooseGenerator')
              : t('problemActions.stressTestDialog.button.chooseBruteForce')
          }
        />
      )}
    </CPBuddyFlex>
  );
});
