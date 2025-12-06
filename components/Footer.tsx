import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full py-4 mt-auto text-center text-xs text-slate-400 no-print">
            <div className="max-w-7xl mx-auto px-4">
                <p>
                    Version {__APP_VERSION__} • License: {__APP_LICENSE__}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
