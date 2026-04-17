import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SubmitDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SubmitDialog = memo(({ open, onClose, onConfirm }: SubmitDialogProps) => {
  const { t } = useTranslation();
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const frameId = requestAnimationFrame(() => {
      confirmButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [open]);

  return (
    <Dialog fullWidth maxWidth={false} open={open} onClose={onClose}>
      <DialogTitle>{t('problemActions.submitDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('problemActions.submitDialog.content')}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          {t('problemActions.submitDialog.cancel')}
        </Button>
        <Button ref={confirmButtonRef} onClick={onConfirm} color='primary' autoFocus>
          {t('problemActions.submitDialog.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
