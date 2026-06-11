import { useNavigate } from "react-router-dom";

export default function Editorial() {
  const navigate = useNavigate();

  return (
    <section className="editorial">
      <div className="editorial-left">
        <img src="/images/editorial-1.jpg" alt="Editorial" />
      </div>

      <div className="editorial-right">
        <h2>ФИЛОСОФИЯ</h2>

        <p>Бренд создаёт одежду на стыке моды и современного искусства</p>
        <p>Мы работаем с архитектурным кроем, фактурными материалами и авангардным минимализмом</p>
        <p>Каждое изделие — это свобода от шаблонов</p>

        <button className="editorial-btn" onClick={() => navigate("/about")}>
          О НАС →
        </button>
      </div>
    </section>
  );
}