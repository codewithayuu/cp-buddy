import ErrorIcon from '@mui/icons-material/Error';
import ReplayIcon from '@mui/icons-material/Replay';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { Component, type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StackTrace from 'stacktrace-js';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const [stackTraceString, setStackTraceString] = useState<string>('Loading stack trace...');
  useEffect(() => {
    let isMounted = true;

    StackTrace.fromError(error)
      .then((frames) => {
        if (!isMounted) return;
        const filteredFrame = frames
          .map(({ fileName, functionName, lineNumber, columnNumber }) => {
            if (fileName?.includes('node_modules')) return null;
            return `at ${functionName || '<anonymous>'} (${fileName}:${lineNumber}:${columnNumber})`;
          })
          .filter(Boolean);
        setStackTraceString(filteredFrame.join('\n'));
      })
      .catch(() => {
        if (isMounted) setStackTraceString(error.stack || 'No stack trace available');
      });

    return () => {
      isMounted = false;
    };
  }, [error]);

  return (
    <>
      <CPBuddyFlex>
        <CPBuddyButton
          icon={ErrorIcon}
          name='Error'
          color='error'
          onClick={() => {
            setOpen(true);
          }}
        />
        <CPBuddyButton
          icon={ReplayIcon}
          name='Retry'
          color='warning'
          onClick={resetErrorBoundary}
        />
      </CPBuddyFlex>
      <Dialog
        fullWidth
        maxWidth={false}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle>{t('errorBoundary.title')}</DialogTitle>
        <DialogContent>
          <CPBuddyFlex column>
            <Typography>{t('errorBoundary.description')}</Typography>
            <Accordion sx={{ width: '100%' }}>
              <AccordionSummary>{t('errorBoundary.details')}</AccordionSummary>
              <AccordionDetails>
                <Box component='pre' sx={{ overflow: 'scroll' }}>
                  {error.name}: {error.message}
                  '\n'
                  {stackTraceString}
                </Box>
              </AccordionDetails>
            </Accordion>
          </CPBuddyFlex>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public resetBoundary = () => {
    this.setState({ hasError: false, error: null }, () => {
      this.forceUpdate();
    });
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.resetBoundary} />;
    }
    return this.props.children;
  }
}
