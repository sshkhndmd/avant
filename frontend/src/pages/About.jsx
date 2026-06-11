import { useEffect, useState } from "react";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";

export default function About() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header openMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} close={() => setMenuOpen(false)} />

      <section className="about-hero">
        <div className="about-hero-bg">
          <img src="/images/about-hero.jpg" alt="About hero" />
        </div>

        <div className="about-hero-content">
          <div className="about-kicker">AVANT / CONCEPTUAL WEAR</div>
          <h1>О НАС</h1>
          <p>
            Мы создаём одежду как форму высказывания: про свободу, городскую энергию и
            индивидуальность. В наших коллекциях важны силуэт, фактура и ощущение движения.
          </p>
        </div>
      </section>

      <section className="about-grid">
        <div className="about-card">
          <h2>Идея</h2>
          <p>
            Бренд вырос из желания объединить дизайн и практичность. Мы делаем вещи,
            которые выглядят как арт-объекты, но живут в реальном ритме города.
          </p>
        </div>

        <div className="about-card">
          <h2>Крой</h2>
          <p>
            Архитектурные линии, асимметрия, баланс объёма и пустоты. Мы проектируем
            форму так, чтобы она работала и в движении, и в статике.
          </p>
        </div>

        <div className="about-card">
          <h2>Материалы</h2>
          <p>
            Мы выбираем ткани по пластике, плотности и тактильности. Фактура — часть
            идеи: матовое, шероховатое, гладкое, плотное — это язык коллекции.
          </p>
        </div>

        <div className="about-card">
          <h2>Подход</h2>
          <p>
            Минимум лишнего, максимум смысла. Мы не гонимся за трендами — мы строим
            систему вещей, которые можно сочетать, наслаивать и переосмыслять.
          </p>
        </div>
      </section>

      <section className="about-manifest">
        <div className="about-manifest-inner">
          <h2>Манифест</h2>
          <p>
            Мы верим, что одежда — это не декор, а инструмент. Она может собирать
            человека, задавать темп, защищать, усиливать и говорить за него.
          </p>
          <p className="about-manifest-quote">
            «Форма — это характер. Деталь — это намерение.»
          </p>
        </div>
      </section>

     
    </>
  );
}