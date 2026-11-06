import { useLanguage } from '../useLanguage.js';

function OrderTimeline({ steps }) {
  const { t } = useLanguage();

  return (
    <div className="timeline" aria-label={t('Order status')}>
      {steps.map((step, index) => (
        <div
          key={`${step.label}-${index}`}
          className={step.completed ? 'timeline-item complete' : 'timeline-item'}
          aria-current={step.completed && (index === steps.length - 1 || !steps[index + 1]?.completed) ? 'step' : undefined}
        >
          <div className="timeline-marker">
            <div className="timeline-dot" />
          </div>
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
