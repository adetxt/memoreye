import { FC, useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";

type PhotoCardProps = {
  image: HTMLImageElement;
};

export const PhotoCard: FC<PhotoCardProps> = (props) => {
  const { image } = props;

  useEffect(() => {
    if (image) {
      image.alt = "Photo";
      image.className = "w-full max-h-80 object-cover";
    }
  }, [image]);

  return (
    <div className="bg-white rounded overflow-hidden shadow-md mb-4">
      {image && (
        <LazyLoadImage
          src={image.src}
          alt="Photo"
          effect="opacity"
          className="w-full max-h-80 object-cover"
        />
      )}
    </div>
  );
};
