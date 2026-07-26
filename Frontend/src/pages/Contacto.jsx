import Card from "../components/Card/Card";
import pagestyles from "./page.module.scss"

export default function Home() {
    return (
        <div className={pagestyles.page}>
            <Card/>
        </div>
    );
}