function OrderTimeline({ steps }) {
  return (
    <div className="timeline" aria-label="Order status">
      {steps.map((step, index) => (
        <div key={`${step.label}-${index}`} className={step.completed ? 'timeline-item complete' : 'timeline-item'}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{step.label}</strong>
            <span>{step.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderTimeline;
