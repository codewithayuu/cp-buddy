import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { useProblemDispatch } from '@/context/ProblemContext';

export const DragOverlay = () => {
  const { t } = useTranslation();
  const dispatch = useProblemDispatch();
  const [dragData, setDragData] = useState<string[] | null | undefined>(null);

  useEffect(() => {
    const onDragOver = (e: DragEvent) =>
      e.dataTransfer?.types.includes('text/uri-list') && setDragData(undefined);
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('text/uri-list')) {
        return;
      }
      const items: string[] = [];
      for (const item of e.dataTransfer.getData('text/plain').replaceAll('\r', '').split('\n') ||
        []) {
        items.push(item);
      }
      if (!items.length) {
        setDragData(null);
      } else {
        setDragData(items);
        dispatch({ type: 'dragDrop', items });
        setTimeout(() => setDragData(null), 1000);
      }
    };
    const onDragLeave = (e: DragEvent) =>
      (e.x >= 0 && e.x <= window.innerWidth && e.y >= 0 && e.y <= window.innerHeight) ||
      setDragData(null);

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('dragleave', onDragLeave);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('dragleave', onDragLeave);
    };
  }, [dispatch]);

  return (
    <Backdrop
      sx={(theme) => ({
        zIndex: theme.zIndex.drawer + 1,
      })}
      open={dragData !== null}
    >
      {dragData ? (
        <CPBuddyFlex
          column
          sx={{ width: '100%', height: '100%', paddingX: 2, justifyContent: 'center' }}
        >
          <List
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
            }}
          >
            {dragData.map((path) => (
              <ListItem key={path}>
                <ListItemIcon>
                  <InsertDriveFileIcon />
                </ListItemIcon>
                <ListItemText primary={path} />
              </ListItem>
            ))}
          </List>
        </CPBuddyFlex>
      ) : (
        <CPBuddyFlex
          column
          sx={{ width: '100%', height: '100%', gap: 2, color: '#ffffff', justifyContent: 'center' }}
        >
          <DownloadIcon sx={{ fontSize: 80 }} />
          <Typography variant='h5'>{t('dragOverlay.description')}</Typography>
          <Button variant='contained' color='primary' onClick={() => setDragData(null)}>
            {t('dragOverlay.cancel')}
          </Button>
        </CPBuddyFlex>
      )}
    </Backdrop>
  );
};
