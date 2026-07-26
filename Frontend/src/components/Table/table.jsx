import styles from "./table.module.scss";

const toTitle = (value) =>
    value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function GenericTable({ data = [], caption }) {
    if (!data.length) {
        return <p className={styles.empty}>No hay datos para mostrar.</p>;
    }

    const columns = Object.keys(data[0]);

    return (
        <div className={styles.wrapper}>
            <table className={styles.table} data-responsive="true">
                {caption && <caption>{caption}</caption>}
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{toTitle(column)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column) => (
                                <td key={column} data-label={toTitle(column)}>
                                    {row[column] ?? "—"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
