import { useMemo, useState } from 'react';
import { printTemplates, defaultPrintTemplateId, type PrintTemplateId } from './registry';

export function PrintView() {
  const [templateId, setTemplateId] = useState<PrintTemplateId>(defaultPrintTemplateId);
  const template = useMemo(
    () => printTemplates.find((entry) => entry.id === templateId) ?? printTemplates[0],
    [templateId],
  );
  const TemplateComponent = template.Component;

  const printNow = () => {
    window.print();
  };

  return (
    <div className="print-app">
      <div className="print-toolbar">
        <div className="print-toolbar__brand">
          <div className="print-toolbar__eyebrow">The Wilds</div>
          <div className="print-toolbar__title">Print Preview</div>
          <div className="print-toolbar__subtitle">
            Browser preview for US Letter. Use the print dialog to export PDFs.
          </div>
        </div>

        <div className="print-toolbar__actions">
          <button className="primary" onClick={printNow}>Print</button>
        </div>
      </div>

      <div className="print-template-tabs">
        {printTemplates.map((entry) => (
          <button
            key={entry.id}
            className={templateId === entry.id ? 'primary' : ''}
            onClick={() => setTemplateId(entry.id)}
            title={entry.description}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="print-template-description">
        <strong>{template.label}:</strong> {template.description}
      </div>

      <div className="print-preview">
        <TemplateComponent />
      </div>
    </div>
  );
}
