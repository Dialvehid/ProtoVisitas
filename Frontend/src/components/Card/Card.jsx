import styles from "./Card.module.scss";

function Card({
  name = "ProtoVisitas",
  handle = "@demo",
  title = "Gestión de visitas técnicas",
  bio1 = "Proyecto demostrativo con React y FastAPI",
  bio2 = "Datos ficticios y configuración por entorno",
  avatar = "https://assets-v2.lottiefiles.com/a/b3202668-1151-11ee-939e-cf25d6aad422/LXZKuNhIQ5.gif",
  coverUrl,
  onMessage = () => { },
  onFollow = () => { },
  isPro = false,
}) {
  return (
    <div className={styles.pfCard}>
      <div
        className={styles.cover}
        style={{
          backgroundImage: coverUrl ? `url("${coverUrl}")` : 'cover'
        }}
      >
        {isPro && <div className={styles.badge}>PRO</div>}
        <img className={styles.avatar} src={avatar} alt={`${name} avatar`} />
      </div>

      <div className={styles.body}>
        <h2 className={styles.name}>{name}</h2>
        <p className={styles.handle}>{handle}</p>

        <div className={styles.bio}>
          <p>{title}</p>
          <p>{bio1}</p>
          <p>{bio2}</p>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnSolid}`}
            onClick={onMessage}
          >
            Message
          </button>
          <button
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={onFollow}
          >
            Follow
          </button>
        </div>
      </div>
    </div>
  );
}

export default Card;
