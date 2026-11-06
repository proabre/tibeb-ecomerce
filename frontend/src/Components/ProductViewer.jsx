import { useState } from 'react';
import { Move3d } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

function ProductViewer({ images, videos = [], name }) {
  const { t } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = images[activeImageIndex];

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    event.currentTarget.style.setProperty('--tilt-x', `${(0.5 - y) * 10}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(x - 0.5) * 12}deg`);
    event.currentTarget.style.setProperty('--shine-x', `${x * 100}%`);
    event.currentTarget.style.setProperty('--shine-y', `${y * 100}%`);
  };

  const resetPointer = (event) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
    event.currentTarget.style.setProperty('--shine-x', '50%');
    event.currentTarget.style.setProperty('--shine-y', '50%');
  };

  return (
    <div className="product-viewer">
      <div
        className="product-viewer-stage"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
        onPointerCancel={resetPointer}
      >
        <div className="product-viewer-glow" aria-hidden="true" />
        <div className="product-viewer-card">
          <img
            className="product-viewer-image"
            src={activeImage}
            alt={`${name} - ${t(activeImageIndex === 0 ? 'Front view' : activeImageIndex === 1 ? 'Back view' : 'Product image')}`}
          />
          <div className="product-viewer-shine" aria-hidden="true" />
        </div>
        <span className="viewer-angle">
          {t(activeImageIndex === 0 ? 'Front view' : activeImageIndex === 1 ? 'Back view' : 'Product image')}
        </span>
        <span className="viewer-hint">
          <Move3d size={15} aria-hidden="true" />
          {t('Move to explore')}
        </span>
        <span className="viewer-index">
          {String(activeImageIndex + 1).padStart(2, '0')} /{' '}
          {String(images.length).padStart(2, '0')}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="product-viewer-thumbnails" aria-label={t('Product images')}>
          {images.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              className={index === activeImageIndex ? 'viewer-thumbnail active' : 'viewer-thumbnail'}
              onClick={() => setActiveImageIndex(index)}
              aria-label={`${t('View image')} ${index + 1}: ${name}`}
              aria-pressed={index === activeImageIndex}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      {videos.length > 0 ? (
        <section className="product-video-section" aria-labelledby="product-videos-title">
          <div className="product-media-heading">
            <span className="eyebrow">{t('Product videos')}</span>
            <h2 id="product-videos-title">{t('See it in motion')}</h2>
          </div>
          <div className="product-video-grid">
            {videos.map((video, index) => (
              <video
                key={`${video}-${index}`}
                className="product-video"
                src={video}
                controls
                playsInline
                preload="metadata"
                aria-label={`${name} - ${t('Product video')} ${index + 1}`}
              >
                {t('Your browser does not support video playback.')}
              </video>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ProductViewer;
