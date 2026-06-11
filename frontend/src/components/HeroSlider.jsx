import { useEffect, useState } from "react";

export default function HeroSlider() {

  const slides = [
    "/images/hero-1.jpg",
    "/images/hero-2.jpg",
    "/images/hero-3.jpg",
    "/images/hero-4.jpg"
    
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="hero">
      {slides.map((img, i) => (
        <div key={i} className={`hero-slide ${i === index ? "active" : ""}`}>
          <img src={img} />
        </div>
      ))}

      <div className="hero-title">AVANT-GARDE FORM</div>
    </section>
  );
}