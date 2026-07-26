import Navbar from "./Navbar";
import Footer from "./Footer";
import styles from "./layout.module.scss";

export default function Layout({ children, user, onLogout }) {
    return (
        <div className={styles.layout}>
            <Navbar user={user} onLogout={onLogout} />
                <main className={styles.main}>{children}</main>
            <Footer />
        </div>
    );
}
