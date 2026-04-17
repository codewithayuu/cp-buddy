import type { IWebviewBackgroundProblem, IWebviewProblem, ProblemId } from '@cpbuddy/core';
import { VerdictType } from '@cpbuddy/core';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ProblemActions } from '@/components/actions/problemActions';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyMenu } from '@/components/base/cpbuddyMenu';
import { ErrorBoundary } from '@/components/base/errorBoundary';
import { ProblemTitle } from '@/components/problemTitle';
import { TestcasesView } from '@/components/testcasesView';
import { VerdictSummary } from '@/components/verdictSummary';
import { useProblemDispatch } from '@/context/ProblemContext';

interface ProblemViewProps {
  problemId: ProblemId;
  problem: IWebviewProblem;
  startTime: number;
  backgroundProblems: IWebviewBackgroundProblem[];
}

export const ProblemView = memo(
  ({ problemId, problem, startTime, backgroundProblems }: ProblemViewProps) => {
    const { t } = useTranslation();
    const dispatch = useProblemDispatch();
    const hasRunning = useMemo(() => {
      for (const [_, testcase] of Object.entries(problem.testcases))
        if (testcase.result?.verdict.type === VerdictType.running) return true;
      return false;
    }, [problem.testcases]);

    return (
      <>
        <ErrorBoundary>
          <ProblemTitle
            problemId={problemId}
            name={problem.name}
            url={problem.url}
            checker={problem.checker}
            interactor={problem.interactor}
            timeElapsedMs={problem.timeElapsedMs}
            overrides={problem.overrides}
            startTime={startTime}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <VerdictSummary testcaseOrder={problem.testcaseOrder} testcases={problem.testcases} />
        </ErrorBoundary>
        <CPBuddyFlex
          column
          sx={{
            flex: 1,
            overflowY: 'scroll',
            paddingY: 2,
            scrollbarWidth: 'none',
            width: '100%',
          }}
        >
          <ErrorBoundary>
            <CPBuddyMenu
              menu={{
                [t('problemView.menu.clearStatus')]: () => {
                  dispatch({ type: 'clearTestcaseStatus', problemId });
                },
              }}
              sx={{ flex: 1, width: '100%' }}
            >
              <TestcasesView
                problemId={problemId}
                testcaseOrder={problem.testcaseOrder}
                testcases={problem.testcases}
              />
            </CPBuddyMenu>
          </ErrorBoundary>
        </CPBuddyFlex>
        <ErrorBoundary>
          <ProblemActions
            problemId={problemId}
            url={problem.url}
            stressTest={problem.stressTest}
            hasRunning={hasRunning}
            backgroundProblems={backgroundProblems}
          />
        </ErrorBoundary>
      </>
    );
  },
);
