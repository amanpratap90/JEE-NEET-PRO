import { useParams, useNavigate } from "react-router-dom";
import { exams } from "../data/Exams";

export default function Subjects() {
    const { exam } = useParams();
    const navigate = useNavigate();

    const examData = exams[exam];

    if (!examData) {
        return <h2>Invalid Exam</h2>;
    }

    return (
        <div className="container page">
            <button
                onClick={() => navigate(-1)}
                className="auth-btn"
                style={{
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--text-secondary)',
                    color: 'var(--text-secondary)'
                }}
            >
                &larr; Back
            </button>
            <h1>{examData.name} Subjects</h1>

            <div className="grid">
                {examData.subjects.map((subject) => (
                    <div
                        key={subject}
                        className="card"
                        onClick={() => navigate(`/${exam}/subjects/${subject.toLowerCase()}`)}
                    >
                        <h2>{subject}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
}
