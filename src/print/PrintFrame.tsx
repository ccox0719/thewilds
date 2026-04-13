import type { ReactNode } from 'react';

interface PrintPageProps {
  title: string;
  subtitle?: string;
  footer?: string;
  className?: string;
  children: ReactNode;
}

export function PrintPage({ title, subtitle, footer, className, children }: PrintPageProps) {
  return (
    <section className={`print-page ${className ?? ''}`.trim()}>
      <header className="print-page__header">
        <div>
          <div className="print-page__eyebrow">The Wilds</div>
          <h1 className="print-page__title">{title}</h1>
          {subtitle && <div className="print-page__subtitle">{subtitle}</div>}
        </div>
        {footer && <div className="print-page__footer">{footer}</div>}
      </header>
      <div className="print-page__body">{children}</div>
    </section>
  );
}

interface PrintCardProps {
  title: string;
  headerNote?: string;
  subtitle?: string;
  footer?: string;
  className?: string;
  children: ReactNode;
}

export function PrintCard({ title, headerNote, subtitle, footer, className, children }: PrintCardProps) {
  return (
    <article className={`print-card ${className ?? ''}`.trim()}>
      <div className="print-card__top">
        <div className="print-card__title">{title}</div>
        {headerNote && <div className="print-card__header-note">{headerNote}</div>}
        {subtitle && <div className="print-card__subtitle">{subtitle}</div>}
      </div>
      <div className="print-card__body">{children}</div>
      {footer && <div className="print-card__footer">{footer}</div>}
    </article>
  );
}

interface PrintTokenProps {
  label: string;
  detail?: string;
}

export function PrintToken({ label, detail }: PrintTokenProps) {
  return (
    <div className="print-token">
      <div className="print-token__label">{label}</div>
      {detail && <div className="print-token__detail">{detail}</div>}
    </div>
  );
}
