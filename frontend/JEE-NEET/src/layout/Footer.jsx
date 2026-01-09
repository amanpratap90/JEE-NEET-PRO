export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <h3 className="footer-logo">JEE & NEETPrep</h3>
                    <p className="footer-desc">
                        Comprehensive resource for JEE Main & Advanced aspirants.
                        Master concepts with precision.
                    </p>
                </div>


            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} IIT JEE Prep. All rights reserved.</p>
                <div className="footer-socials">
                    <span>Made By <span style={{ color: '#ef4444' }}>IIITIAN❤</span> for JEE-NEET Aspirants</span>
                </div>
            </div>
        </footer>
    );
}
