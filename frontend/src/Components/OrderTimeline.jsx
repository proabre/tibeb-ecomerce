import { useLanguage } from '../useLanguage.js';

function OrderTimeline({ steps }) {
  const { t } = useLanguage();

  return (
    <div className="timeline" aria-label={t('Order status')}>
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className={step.completed ? 'timeline-item complete' : 'timeline-item'}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{t(step.label)}</strong>
            <span>{t(step.date)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderTimeline;
