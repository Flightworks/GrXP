declare module 'html2pdf.js' {
    interface Html2PdfOptions {
        margin?: number | number[];
        filename?: string;
        image?: { type: 'jpeg' | 'png' | 'webp'; quality: number };
        enableLinks?: boolean;
        html2canvas?: any;
        jsPDF?: any;
    }

    interface Html2PdfWorker {
        from(element: HTMLElement): Html2PdfWorker;
        set(options: Html2PdfOptions): Html2PdfWorker;
        save(filename?: string): Promise<void>;
        output(type: string, options?: any, value?: string): Promise<any>;
        then(callback: () => void): Html2PdfWorker;
    }

    function html2pdf(): Html2PdfWorker;
    export default html2pdf;
}
