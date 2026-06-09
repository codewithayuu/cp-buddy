import type { IWebviewTestcase, ProblemId, TestcaseId } from '@cpbuddy/core';
import { VerdictType } from '@cpbuddy/core';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Accordion from '@mui/material/Accordion';
import Box from '@mui/material/Box';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MD5 from 'crypto-js/md5';
import confetti from 'canvas-confetti';
import { isNil } from 'lodash';
import { type DragEvent, memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyButton } from '@/components/base/cpbuddyButton';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyMenu } from '@/components/base/cpbuddyMenu';
import { CPBuddyText } from '@/components/base/cpbuddyText';
import { CPBuddyTooltip } from '@/components/base/cpbuddyTooltip';
import { ErrorBoundary } from '@/components/base/errorBoundary';
import { RunButtonGroup } from '@/components/runButtonGroup';
import { TestcaseDataView } from '@/components/testcaseDataView';
import { useProblemDispatch } from '@/context/ProblemContext';

interface TestcaseViewProp {
  problemId: ProblemId;
  testcaseId: TestcaseId;
  testcase: IWebviewTestcase;
  isExpand: boolean;
  idx: number;
  onDragStart?: (idx: number, e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  autoFocus?: boolean;
}

export const TestcaseView = memo(
  ({
    problemId,
    testcaseId,
    testcase,
    isExpand,
    idx,
    onDragStart,
    onDragOver,
    onDragEnd,
    isDragging = false,
    autoFocus = false,
  }: TestcaseViewProp) => {
    const { t } = useTranslation();
    const dispatch = useProblemDispatch();
    const isRunning = testcase.result?.verdict.type === VerdictType.running;
    const expanded = testcase.isDisabled ? false : isExpand;
    
    useEffect(() => {
      if (testcase.result?.verdict.id === 'AC') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, [testcase.result?.verdict.id]);

    const verdictColor = window.easterEgg
      ? (() => {
          const hash = MD5(JSON.stringify(testcase)).words;
          let color = 0;
          for (let i = 0; i < hash.length; i++) {
            color = (color << 4) + hash[i];
          }
          color = (((color >> 16) & 0xff) << 16) | (((color >> 8) & 0xff) << 8) | (color & 0xff);
          return `#${color.toString(16).padStart(6, '0')}`;
        })()
      : testcase.result?.verdict?.color;

    const details = useMemo(
      () => (
        <CPBuddyFlex column>
          <CPBuddyFlex smallGap column>
            <ErrorBoundary>
              <TestcaseDataView
                label={t('testcaseView.stdin')}
                value={testcase.stdin}
                onChange={(data) =>
                  dispatch({
                    type: 'setTestcaseString',
                    problemId,
                    testcaseId,
                    label: 'stdin',
                    data,
                  })
                }
                onChooseFile={() =>
                  dispatch({
                    type: 'chooseTestcaseFile',
                    problemId,
                    label: 'stdin',
                    testcaseId,
                  })
                }
                onToggleFile={() => {
                  dispatch({
                    type: 'toggleTestcaseFile',
                    problemId,
                    label: 'stdin',
                    testcaseId,
                  });
                }}
                onOpenVirtual={() => {
                  dispatch({
                    type: 'openFile',
                    problemId,
                    path: `/testcases/${testcaseId}/stdin`,
                  });
                }}
                autoFocus={autoFocus}
                tabIndex={idx * 2 + 1}
              />
            </ErrorBoundary>
            <ErrorBoundary>
              <TestcaseDataView
                label={t('testcaseView.answer')}
                value={testcase.answer}
                onChange={(data) =>
                  dispatch({
                    type: 'setTestcaseString',
                    problemId,
                    testcaseId,
                    label: 'answer',
                    data,
                  })
                }
                onChooseFile={() =>
                  dispatch({
                    type: 'chooseTestcaseFile',
                    problemId,
                    label: 'answer',
                    testcaseId,
                  })
                }
                onToggleFile={() =>
                  dispatch({
                    type: 'toggleTestcaseFile',
                    problemId,
                    label: 'answer',
                    testcaseId,
                  })
                }
                onOpenVirtual={() =>
                  dispatch({
                    type: 'openFile',
                    problemId,
                    path: `/testcases/${testcaseId}/answer`,
                  })
                }
                tabIndex={idx * 2 + 2}
              />
            </ErrorBoundary>
          </CPBuddyFlex>
          <Divider />
          <CPBuddyFlex smallGap column>
            {!!testcase.result?.stdout && (
              <ErrorBoundary>
                <TestcaseDataView
                  label={t('testcaseView.stdout')}
                  value={testcase.result.stdout}
                  color={verdictColor}
                  readOnly
                  outputActions={{
                    onSetAnswer: () =>
                      dispatch({
                        type: 'updateTestcase',
                        problemId,
                        testcaseId,
                        event: 'setAsAnswer',
                        value: true,
                      }),
                    onCompare: () =>
                      dispatch({
                        type: 'compareTestcase',
                        problemId,
                        testcaseId,
                      }),
                  }}
                  onOpenVirtual={() => {
                    dispatch({
                      type: 'openFile',
                      problemId,
                      path: `/testcases/${testcaseId}/stdout`,
                    });
                  }}
                />
              </ErrorBoundary>
            )}
            {!!testcase.result?.stderr && (
              <ErrorBoundary>
                <TestcaseDataView
                  label={t('testcaseView.stderr')}
                  value={testcase.result.stderr}
                  color={verdictColor}
                  readOnly
                  onOpenVirtual={() => {
                    dispatch({
                      type: 'openFile',
                      problemId,
                      path: `/testcases/${testcaseId}/stderr`,
                    });
                  }}
                />
              </ErrorBoundary>
            )}
            {!!testcase.result?.msg && (
              <ErrorBoundary>
                <TestcaseDataView
                  label={t('testcaseView.message')}
                  value={{ type: 'string', data: testcase.result.msg }}
                  color={verdictColor}
                  readOnly
                />
              </ErrorBoundary>
            )}
          </CPBuddyFlex>
        </CPBuddyFlex>
      ),
      [
        autoFocus,
        dispatch,
        idx,
        problemId,
        testcase.answer,
        testcase.result?.stdout,
        testcase.result?.stderr,
        testcase.result?.msg,
        testcase.stdin,
        testcaseId,
        t,
        verdictColor,
      ],
    );

    return (
      <Accordion
        slotProps={{ transition: { unmountOnExit: true } }}
        expanded={expanded}
        disableGutters
        onChange={() => {
          dispatch({
            type: 'updateTestcase',
            problemId,
            testcaseId,
            event: 'setExpand',
            value: !isExpand,
          });
        }}
        disabled={testcase.isDisabled}
        sx={{
          borderLeft: `4px solid ${verdictColor || 'rgba(255, 255, 255, 0.1)'}`,
          backgroundColor: 'background.paper',
          transition: 'all 0.2s',
          filter: testcase.isDisabled ? 'grayscale(100%)' : 'none',
          marginBottom: 1.5,
          borderRadius: '8px !important',
          overflow: 'hidden',
          borderTop: '1px solid',
          borderRight: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}
      >
        <CPBuddyMenu
          menu={
            testcase.isDisabled
              ? {
                  [t('testcaseView.menu.enableTestcase')]: () =>
                    dispatch({
                      type: 'updateTestcase',
                      problemId,
                      testcaseId,
                      event: 'setDisable',
                      value: false,
                    }),
                }
              : {
                  [t('testcaseView.menu.disableTestcase')]: () =>
                    dispatch({
                      type: 'updateTestcase',
                      problemId,
                      testcaseId,
                      event: 'setDisable',
                      value: true,
                    }),
                  [t('testcaseView.menu.clearTestcaseStatus')]: () =>
                    dispatch({ type: 'clearTestcaseStatus', problemId, testcaseId }),
                }
          }
        >
          <AccordionSummary
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStart?.(idx, e);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDragOver?.(e);
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              onDragEnd?.();
            }}
            sx={{
              '& > span': { margin: '0 !important' },
              cursor: isDragging ? 'grabbing' : testcase.isDisabled ? 'not-allowed' : 'grab',
              pointerEvents: testcase.isDisabled ? 'none' : 'auto',
              minHeight: '56px',
              '&[draggable="true"]': {
                pointerEvents: 'auto',
              },
            }}
          >
            <CPBuddyFlex smallGap sx={{ width: '100%', alignItems: 'center' }}>
              <Box sx={{ flex: 1 }} />
              
              <CPBuddyFlex sx={{ alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                <CPBuddyTooltip title={testcaseId}>
                  <CPBuddyText sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.secondary' }}>#{idx + 1}</CPBuddyText>
                </CPBuddyTooltip>
                {!!testcase.result?.verdict && (
                  <CPBuddyTooltip title={testcase.result.verdict.fullName}>
                    <Chip
                      label={testcase.result.verdict.name}
                      size='small'
                      sx={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${testcase.result.verdict.color}`,
                        color: testcase.result.verdict.color,
                        fontWeight: 600,
                        height: '24px',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                      }}
                    />
                  </CPBuddyTooltip>
                )}
                {!isNil(testcase.result?.memoryMb) && (
                  <CPBuddyTooltip title={testcase.result.memoryMb}>
                    <Chip
                      label={t('testcaseView.memory', {
                        memory: testcase.result.memoryMb.toFixed(1),
                      })}
                      size='small'
                      variant='outlined'
                      sx={{
                        fontSize: '0.75rem',
                        display: { xs: 'none', xl: 'flex' },
                        borderColor: 'divider',
                      }}
                    />
                  </CPBuddyTooltip>
                )}
                {!isNil(testcase.result?.timeMs) && (
                  <CPBuddyTooltip title={testcase.result.timeMs}>
                    <Chip
                      label={t('testcaseView.time', {
                        time: testcase.result.timeMs.toFixed(1),
                      })}
                      size='small'
                      variant='outlined'
                      sx={{
                        fontSize: '0.75rem',
                        display: { xs: 'none', lg: 'flex' },
                        borderColor: 'divider',
                      }}
                    />
                  </CPBuddyTooltip>
                )}
              </CPBuddyFlex>

              <CPBuddyFlex sx={{ flex: 1, justifyContent: 'flex-end', gap: 1 }}>
                {isRunning ? (
                  <CPBuddyButton
                    name={t('testcaseView.stop')}
                    icon={StopIcon}
                    color='warning'
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'stopTestcases', problemId, testcaseId });
                    }}
                  />
                ) : (
                  <RunButtonGroup
                    icon={PlayArrowIcon}
                    name={t('testcaseView.run')}
                    color='success'
                    onRun={(forceCompile) => {
                      dispatch({ type: 'runSingleTestcase', problemId, testcaseId, forceCompile });
                    }}
                  />
                )}
                <CPBuddyButton
                  name={t('testcaseView.delete')}
                  icon={DeleteIcon}
                  color='error'
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'deleteTestcase', problemId, testcaseId });
                  }}
                  sx={{ display: { xs: 'none', md: 'flex' } }}
                />
              </CPBuddyFlex>
            </CPBuddyFlex>
          </AccordionSummary>
        </CPBuddyMenu>
        <AccordionDetails>{details}</AccordionDetails>
      </Accordion>
    );
  },
);
