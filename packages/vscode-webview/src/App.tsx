import Alert from '@mui/material/Alert';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import i18n from 'i18next';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { initReactI18next, useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { ErrorBoundary } from '@/components/base/errorBoundary';
import { CreateProblemView } from '@/components/createProblemView';
import { DragOverlay } from '@/components/dragOverlay';
import { InitView } from '@/components/initView';
import { ProblemView } from '@/components/problemView';
import { ConfigProvider, useConfigState } from '@/context/ConfigContext';
import { ProblemProvider, useProblemState } from '@/context/ProblemContext';
import langEn from '@/l10n/en.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: langEn },
  },
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

const Main = () => {
  const problem = useProblemState();
  const config = useConfigState();
  const { t } = useTranslation();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('xl'));

  if (!problem.isReady || !config.isReady) return <InitView />;

  return (
    <>
      <ErrorBoundary>
        <DragOverlay />
      </ErrorBoundary>
      <ErrorBoundary>
        <CPBuddyFlex
          column
          smallGap
          sx={{ height: '100%', boxSizing: 'border-box', padding: { xs: 0.5, md: 1 } }}
        >
          {problem.currentProblem.type === 'active' ? (
            <ProblemView
              {...problem.currentProblem}
              backgroundProblems={problem.backgroundProblems}
            />
          ) : (
            <CreateProblemView canImport={problem.currentProblem.canImport} />
          )}
          {isNarrow && (
            <Alert severity='info' sx={{ fontSize: '0.75rem', py: 0 }}>
              {t('main.narrowWidthAlert')}
            </Alert>
          )}
        </CPBuddyFlex>
      </ErrorBoundary>
    </>
  );
};

const App = () => {
  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  const theme = createTheme({
    palette: { mode: isDark ? 'dark' : 'light' },
    breakpoints: { values: { xs: 170, sm: 220, md: 270, lg: 320, xl: 370 } },
  });
  return (
    <ThemeProvider theme={theme}>
      <ProblemProvider>
        <ConfigProvider>
          <Main />
        </ConfigProvider>
      </ProblemProvider>
    </ThemeProvider>
  );
};

const element = document.getElementById('root');
if (element) createRoot(element).render(<App />);
