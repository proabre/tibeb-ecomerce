import { useState } from 'react';
import { Move3d } from 'lucide-react';

function ProductViewer({ images, name }) {
  const [activeImage, setActiveImage] = useState(images[0]);

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
          <img className="product-viewer-image" src={activeImage} alt={name} />
          <div className="product-viewer-shine" aria-hidden="true" />
        </div>
        <span className="viewer-hint">
          <Move3d size={15} aria-hidden="true" />
          Move to explore
        </span>
        <span className="viewer-index">
          {String(images.indexOf(activeImage) + 1).padStart(2, '0')} /{' '}
          {String(images.length).padStart(2, '0')}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="product-viewer-thumbnails" aria-label="Product images">
          {images.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              className={image === activeImage ? 'viewer-thumbnail active' : 'viewer-thumbnail'}
              onClick={() => setActiveImage(image)}
              aria-label={`View ${name}, image ${index + 1}`}
              aria-pressed={image === activeImage}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}

    </div>
  );
}

export default ProductViewer;
