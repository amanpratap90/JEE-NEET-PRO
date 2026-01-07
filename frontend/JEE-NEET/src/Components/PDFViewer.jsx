import React, { useEffect } from 'react';

const PDFViewer = ({ url, onClose }) => {
    // Process Google Drive URL to ensure preview mode
    const getPreviewUrl = (link) => {
        try {
            if (link.includes('drive.google.com')) {
                // Replace /view or /edit with /preview
                return link.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
            }
            return link;
        } catch (e) {
            return link;
        }
    };

    const previewUrl = getPreviewUrl(url);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    maxWidth: '1200px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="auth-btn"
                        style={{ width: 'auto', padding: '0.5rem 1.5rem', backgroundColor: '#ef4444' }}
                    >
                        Close
                    </button>
                </div>

                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe
                        src={previewUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        allow="autoplay"
                        title="PDF Viewer"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default PDFViewer;
