import { RiskEntry, StudyContext, RiskLevel } from '../types';

// Color mapping based on constants.ts (Tailwind classes to Hex)
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  [RiskLevel.Inacceptable]: { bg: '#DC2626', text: '#FFFFFF', border: '#991B1B' }, // red-600, white, red-800
  [RiskLevel.Fort]: { bg: '#F97316', text: '#FFFFFF', border: '#C2410C' },         // orange-500, white, orange-700
  [RiskLevel.Faible]: { bg: '#FDE047', text: '#0F172A', border: '#EAB308' },       // yellow-300, slate-900, yellow-500
  [RiskLevel.Usuel]: { bg: '#22C55E', text: '#FFFFFF', border: '#15803D' },        // green-500, white, green-700
};

const DEFAULT_COLOR = { bg: '#E5E7EB', text: '#1F2937', border: '#D1D5DB' }; // gray-200, gray-800, gray-300

const getRiskStyle = (level: RiskLevel) => {
  return RISK_COLORS[level] || DEFAULT_COLOR;
};

const formatDate = (dateString: string) => {
  if (!dateString) return new Date().toLocaleDateString('fr-FR');
  return dateString;
};

export const generateHtmlContent = (context: StudyContext, risks: RiskEntry[]): string => {
  const { studyName, experimentation, aircraft, date, globalSynthesis } = context;

  // Sort risks by residual risk level (Inacceptable -> Usuel) usually makes sense,
  // but let's stick to the current list order or updated order as passed.
  // The Dashboard passes them sorted by updatedAt, but typically reports are sorted by criticality.
  // For now, we respect the order passed in (which is the view order).

  const rows = risks.map(risk => {
    const level = risk.residualRisk.computedLevel;
    const style = getRiskStyle(level);

    // Formatting mitigation measures: convert newlines to <br>
    const mitigation = risk.mitigationMeasures
      ? risk.mitigationMeasures.replace(/\n/g, '<br>')
      : '<i>Aucune mesure définie</i>';

    return `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 12px; vertical-align: top; border-bottom: 1px solid #E2E8F0;">
          <div style="font-weight: bold; font-size: 14px; color: #0F172A; margin-bottom: 4px;">${risk.activityTitle || 'Sans titre'}</div>
          <div style="font-size: 13px; color: #64748B;">${risk.dreadedEvent || ''}</div>
        </td>
        <td style="padding: 12px; vertical-align: top; font-size: 13px; color: #334155; border-bottom: 1px solid #E2E8F0;">
          ${mitigation}
        </td>
        <td style="padding: 12px; vertical-align: top; text-align: center; border-bottom: 1px solid #E2E8F0; width: 120px;">
          <span style="
            display: inline-block;
            padding: 6px 12px;
            background-color: ${style.bg};
            color: ${style.text};
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid ${style.border};
            white-space: nowrap;
          ">
            ${level}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Synthèse des Risques - ${studyName}</title>
    </head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #0F172A; background-color: #FFFFFF;">

      <!-- Header -->
      <div style="margin-bottom: 24px; border-bottom: 2px solid #0F172A; padding-bottom: 16px;">
        <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0 0 12px 0; color: #0F172A;">
          Synthèse des Risques
        </h1>
        <table style="width: 100%; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding-bottom: 4px;"><strong>Étude :</strong> ${studyName}</td>
            <td style="padding-bottom: 4px;"><strong>Aéronef :</strong> ${aircraft}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 4px;"><strong>Expérimentation :</strong> ${experimentation}</td>
            <td style="padding-bottom: 4px;"><strong>Date :</strong> ${formatDate(date)}</td>
          </tr>
        </table>
      </div>

      <!-- Main Table -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #F8FAFC;">
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #E2E8F0; width: 35%;">Risque & Description</th>
            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #E2E8F0;">Mesures d'atténuation</th>
            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748B; border-bottom: 2px solid #E2E8F0;">Niveau Résiduel</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <!-- Global Synthesis -->
      <div style="background-color: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569;">
          Conclusion Globale
        </h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1E293B;">
          ${globalSynthesis ? globalSynthesis.replace(/\n/g, '<br>') : 'Aucune conclusion enregistrée.'}
        </p>
      </div>

      <div style="margin-top: 24px; font-size: 11px; color: #94A3B8; text-align: right;">
        Généré par GrXP le ${new Date().toLocaleDateString('fr-FR')}
      </div>

    </body>
    </html>
  `;
};

export const downloadHtmlBlob = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'application/msword' }); // 'application/msword' or 'text/html'
  // Using 'application/msword' hints the browser/OS to open it with Word,
  // even though it's HTML. Alternatively, use 'text/html' and let user choose.
  // The user requested .doc compatibility.

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
