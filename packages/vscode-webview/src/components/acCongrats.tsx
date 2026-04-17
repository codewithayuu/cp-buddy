import { useTranslation } from 'react-i18next';
import { CPBuddyFlex } from '@/components/base/cpbuddyFlex';
import { CPBuddyText } from '@/components/base/cpbuddyText';

export const AcCongrats = () => {
  const { t } = useTranslation();

  return (
    <CPBuddyFlex column>
      <img width='30%' src={partyUri} alt='AC congratulations gif' />
      <CPBuddyText sx={{ textAlign: 'center' }}>
        {t('acCongrats.firstLine')}
        <br />
        {t('acCongrats.secondLine')}
      </CPBuddyText>
    </CPBuddyFlex>
  );
};
