import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyText } from '@/components/base/cpbuddyText';

export const NoTestcases = () => {
  const { t } = useTranslation();

  return (
    <CPBuddyFlex column>
      <CPBuddyText sx={{ textAlign: 'center' }}>
        {t('noTestcases.firstLine')}
        <br />
        {t('noTestcases.secondLine')}
      </CPBuddyText>
    </CPBuddyFlex>
  );
};
