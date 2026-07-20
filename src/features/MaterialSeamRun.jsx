import materialSeam from "../assets/material-stage/memory-seam-alpha.webp";
import desktopMaterialSeam from "../assets/material-stage/memory-seam-desktop-alpha.webp";

export function MaterialSeamRun({
  className = "",
  imageRef,
  onFirstLoad,
  onFirstError,
}) {
  return (
    <div className={className} aria-hidden="true">
      <div className="material-seam-run">
        <picture>
          <source media="(min-width: 700px)" srcSet={desktopMaterialSeam} />
          <img
            ref={imageRef}
            src={materialSeam}
            alt=""
            draggable="false"
            decoding="async"
            onLoad={onFirstLoad}
            onError={onFirstError}
          />
        </picture>
      </div>
    </div>
  );
}
