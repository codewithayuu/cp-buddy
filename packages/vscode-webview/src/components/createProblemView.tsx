import InputIcon from '@mui/icons-material/Input';
import SendIcon from '@mui/icons-material/Send';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { useProblemDispatch } from '@/context/ProblemContext';

interface CreateProblemProps {
  canImport: boolean;
}

export const CreateProblemView = ({ canImport }: CreateProblemProps) => {
  const { t } = useTranslation();
  const dispatch = useProblemDispatch();
  return (
    <CPBuddyFlex column sx={{ gap: 5, paddingY: 2 }}>
      <CPBuddyFlex column>
        <Alert
          sx={{ width: '100%', boxSizing: 'border-box' }}
          variant='outlined'
          severity='warning'
        >
          {canImport ? t('createProblemView.importAlert') : t('createProblemView.createAlert')}
        </Alert>
        <CPBuddyFlex>
          {!!canImport && (
            <Button
              fullWidth
              variant='contained'
              endIcon={<InputIcon />}
              onClick={() => {
                dispatch({ type: 'importProblem' });
              }}
            >
              {t('createProblemView.importButton')}
            </Button>
          )}
          <Button
            fullWidth
            variant={canImport ? 'outlined' : 'contained'}
            endIcon={<SendIcon />}
            onClick={() => {
              dispatch({ type: 'createProblem' });
            }}
          >
            {t('createProblemView.createButton')}
          </Button>
        </CPBuddyFlex>
      </CPBuddyFlex>
    </CPBuddyFlex>
  );
};
