import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteProblemDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteProblemDialog = memo(
  ({ open, onClose, onConfirm }: DeleteProblemDialogProps) => {
    const { t } = useTranslation();
    return (
      <Dialog fullWidth maxWidth={false} open={open} onClose={onClose}>
        <DialogTitle>{t('problemActions.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('problemActions.deleteDialog.content')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color='primary'>
            {t('problemActions.deleteDialog.cancel')}
          </Button>
          <Button onClick={onConfirm} color='primary' autoFocus>
            {t('problemActions.deleteDialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  },
);
