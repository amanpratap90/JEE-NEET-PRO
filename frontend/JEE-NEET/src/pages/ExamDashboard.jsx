import { useParams, Link } from "react-router-dom";

export default function ExamDashboard() {
    const { exam } = useParams();
    const examName = exam ? exam.toUpperCase() : "";

    const links = [
        { title: "Question Bank", path: "subjects", icon: "📚", desc: "Chapter-wise practice questions" },
        { title: "Test Series", path: "test-series", icon: "📝", desc: "Full-length mock tests" },
        { title: "Notes", path: "notes", icon: "📒", desc: "Comprehensive study notes" },
        { title: "Short Notes", path: "short-notes", icon: "📑", desc: "Quick revision formulae" },
        { title: "Books", path: "books", icon: "📖", desc: "Recommended PDFs and Reference Books" },
    ];

    return (
        <div className="container page">
            <div className="hero" style={{ minHeight: 'auto', padding: '4rem 0 2rem' }}>
                <h1 className="gradient-text">{examName} Dashboard</h1>
                <p className="subtitle">Everything you need to crack {examName}</p>
            </div>

            <div className="grid">
                {links.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className="card"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{link.icon}</div>
                        <h2>{link.title}</h2>
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{link.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
