import { useNavigate } from "react-router-dom";

export default function ExamSelect() {
    const navigate = useNavigate();

    return (
        <div className="container page">
            <h1>Select Your Exam</h1>

            <div className="grid">
                <div className="card" onClick={() => navigate("/jee-mains")}>
                    <h2>JEE MAINS</h2>
                    <p>Physics · Chemistry · Maths</p>
                </div>

                <div className="card" onClick={() => navigate("/neet")}>
                    <h2>NEET</h2>
                    <p>Physics · Chemistry · Biology</p>
                </div>
            </div>
        </div>
    );
}
