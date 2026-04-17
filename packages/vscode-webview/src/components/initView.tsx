import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyText } from '@/components/base/cpbuddyText';

export const InitView = () => {
  const { t } = useTranslation();
  return (
    <CPBuddyFlex column sx={{ height: '100%', justifyContent: 'center', gap: 2 }}>
      <CircularProgress />
      <CPBuddyText sx={{ fontWeight: 'bold', fontSize: 'bigger' }}>
        {t('initView.message')}
      </CPBuddyText>
    </CPBuddyFlex>
  );
};
