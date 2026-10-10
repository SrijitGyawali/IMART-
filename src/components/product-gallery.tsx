"use client";

import Image from "next/image";
import { useState } from "react";
import { StoreIcon } from "./store-icon";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  return <div><div className="product-gallery-main">{images[selected] ? <Image src={images[selected]} alt={name} fill priority sizes="(max-width: 760px) 90vw, 600px" className="object-contain" /> : <div className="product-placeholder"><StoreIcon name="bag" width={60} height={60} /></div>}</div>{images.length > 1 && <div className="product-thumbnails">{images.map((image, index) => <button key={image + index} aria-label={"View product image " + (index + 1)} aria-pressed={selected === index} onClick={() => setSelected(index)}><Image src={image} alt="" fill sizes="75px" className="object-contain" /></button>)}</div>}</div>;
}
