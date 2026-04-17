import type { IWebviewTestcase, TestcaseId } from '@cpbuddy/core';
import { VerdictType } from '@cpbuddy/core';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import Chip from '@mui/material/Chip';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyTooltip } from '@/components/base/cpbuddyTooltip';

interface VerdictSummaryProps {
  testcaseOrder: TestcaseId[];
  testcases: Record<TestcaseId, IWebviewTestcase>;
}

export const VerdictSummary = memo(({ testcaseOrder, testcases }: VerdictSummaryProps) => {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    let running = 0;
    let pending = 0;
    const total = testcaseOrder.length;

    for (const id of testcaseOrder) {
      const tc = testcases[id];
      if (!tc || tc.isDisabled) continue;
      if (!tc.result?.verdict) {
        pending++;
      } else if (tc.result.verdict.type === VerdictType.passed) {
        passed++;
      } else if (tc.result.verdict.type === VerdictType.running) {
        running++;
      } else {
        failed++;
      }
    }
    return { passed, failed, running, pending, total };
  }, [testcaseOrder, testcases]);

  if (stats.total === 0) return null;

  return (
    <CPBuddyFlex alignStart sx={{ flexWrap: 'wrap', display: { xs: 'none', sm: 'flex' } }}>
      {stats.passed > 0 && (
        <CPBuddyTooltip title={t('verdictSummary.passed')}>
          <Chip
            icon={<CheckCircleIcon />}
            label={stats.passed}
            size='small'
            color='success'
            variant='outlined'
          />
        </CPBuddyTooltip>
      )}
      {stats.failed > 0 && (
        <CPBuddyTooltip title={t('verdictSummary.failed')}>
          <Chip
            icon={<ErrorIcon />}
            label={stats.failed}
            size='small'
            color='error'
            variant='outlined'
          />
        </CPBuddyTooltip>
      )}
      {stats.running > 0 && (
        <CPBuddyTooltip title={t('verdictSummary.running')}>
          <Chip
            icon={<HourglassEmptyIcon />}
            label={stats.running}
            size='small'
            color='info'
            variant='outlined'
          />
        </CPBuddyTooltip>
      )}
      {stats.pending > 0 && (
        <CPBuddyTooltip title={t('verdictSummary.pending')}>
          <Chip
            icon={<RemoveCircleOutlinedIcon />}
            label={stats.pending}
            size='small'
            variant='outlined'
          />
        </CPBuddyTooltip>
      )}
    </CPBuddyFlex>
  );
});
