import { RiskEntry, StudyContext, RiskLevel } from '../types';

// Color mapping based on constants.ts (Tailwind classes to Hex)
const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  [RiskLevel.Inacceptable]: { bg: '#DC2626', text: '#FFFFFF', border: '#991B1B' },
  [RiskLevel.Fort]: { bg: '#F97316', text: '#FFFFFF', border: '#C2410C' },
  [RiskLevel.Faible]: { bg: '#FDE047', text: '#0F172A', border: '#EAB308' },
  [RiskLevel.Usuel]: { bg: '#22C55E', text: '#FFFFFF', border: '#15803D' },
};

const DEFAULT_COLOR = { bg: '#E5E7EB', text: '#1F2937', border: '#D1D5DB' };

const getRiskStyle = (level: RiskLevel) => RISK_COLORS[level] || DEFAULT_COLOR;

const formatDate = (dateString: string) => dateString ? dateString : new Date().toLocaleDateString('fr-FR');

const calculateComputedLevel = (g: number, o: string): RiskLevel => {
  if (g === 1) {
    if (o === 'A' || o === 'B' || o === 'C') return RiskLevel.Usuel;
    return RiskLevel.Faible;
  }
  if (g === 2) {
    if (o === 'A' || o === 'B') return RiskLevel.Faible;
    return RiskLevel.Fort;
  }
  if (g === 3) {
    if (o === 'A') return RiskLevel.Faible;
    if (o === 'B') return RiskLevel.Fort;
    return RiskLevel.Inacceptable;
  }
  if (g === 4) {
    if (o === 'A') return RiskLevel.Fort;
    return RiskLevel.Inacceptable;
  }
  return RiskLevel.Faible;
};

export const generateHtmlContent = (context: StudyContext, risks: RiskEntry[]): string => {
  const { studyName, experimentation, aircraft, date, globalSynthesis } = context;

  // Matrix generation for Word
  const rows = [4, 3, 2, 1];
  const cols = ['A', 'B', 'C', 'D'];

  let matrixHtml = `
  <table style="border-collapse: collapse; margin: 20px 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px;">
    <tr>
      <td rowspan="6" style="writing-mode: vertical-lr; transform: rotate(180deg); text-align: center; vertical-align: middle; font-weight: bold; padding: 10px; color: #64748B;">GRAVITÉ</td>
      <td></td>
      <td style="text-align: center; font-weight: bold; color: #64748B; padding: 5px; width: 40px;">A</td>
      <td style="text-align: center; font-weight: bold; color: #64748B; padding: 5px; width: 40px;">B</td>
      <td style="text-align: center; font-weight: bold; color: #64748B; padding: 5px; width: 40px;">C</td>
      <td style="text-align: center; font-weight: bold; color: #64748B; padding: 5px; width: 40px;">D</td>
    </tr>
  `;

  rows.forEach(r => {
    matrixHtml += `<tr><td style="text-align: right; font-weight: bold; padding-right: 10px; color: #64748B;">${r}</td>`;
    cols.forEach(c => {
      const level = calculateComputedLevel(r, c);
      const style = getRiskStyle(level);
      const count = risks.filter(risk => risk.residualRisk.gravity === r && risk.residualRisk.occurrence === c).length;
      const opacity = count > 0 ? '1' : '0.3';
      const textColor = level === RiskLevel.Faible ? '#0F172A' : '#FFFFFF';
      const displayCount = count > 0 ? `<span style="color: ${textColor}; font-weight: bold; font-size: 12px;">${count}</span>` : '&nbsp;';

      matrixHtml += `<td style="background-color: ${style.bg}; opacity: ${opacity}; text-align: center; vertical-align: middle; height: 40px; border: 1px solid #FFFFFF;">${displayCount}</td>`;
    });
    matrixHtml += `</tr>`;
  });

  matrixHtml += `
    <tr>
      <td></td>
      <td></td>
      <td colspan="4" style="text-align: center; font-weight: bold; padding-top: 10px; color: #64748B;">OCCURRENCE</td>
    </tr>
  </table>
  `;

  // Risk elements formatting
  let risksHtml = '';
  risks.forEach((risk, index) => {
    const level = risk.residualRisk.computedLevel;
    const style = getRiskStyle(level);

    const mitigation = risk.mitigationMeasures
      ? risk.mitigationMeasures.replace(/\n/g, '<br/>')
      : '<i>Aucune mesure définie</i>';

    const dreadedEvent = risk.dreadedEvent
      ? risk.dreadedEvent.replace(/\n/g, '<br/>')
      : '<i>Non renseigné</i>';

    risksHtml += `
      <div style="margin-bottom: 20px; page-break-inside: avoid; border: 1px solid #E2E8F0; border-radius: 6px; background-color: #FFFFFF;">
        <div style="background-color: #F8FAFC; padding: 12px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 14px; color: #0F172A;">${index + 1}. ${risk.activityTitle || 'Sans titre'}</h3>
          <span style="display: inline-block; padding: 4px 8px; background-color: ${style.bg}; color: ${style.text}; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
             ${level}
          </span>
        </div>
        <div style="padding: 12px;">
          <div style="margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: bold; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Événement Redouté</div>
            <div style="font-size: 12px; color: #334155; line-height: 1.4;">${dreadedEvent}</div>
          </div>
          <div style="background-color: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 10px;">
            <div style="font-size: 10px; font-weight: bold; color: #0369A1; text-transform: uppercase; margin-bottom: 4px;">Mesures d'Atténuation</div>
            <div style="font-size: 12px; color: #0F172A; line-height: 1.4;">${mitigation}</div>
          </div>
        </div>
      </div>
    `;
  });

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Rapport GrXP - ${studyName}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; }
      </style>
    </head>
    <body style="padding: 20px;">
      
      <!-- HEADER -->
      <table style="width: 100%; border-bottom: 2px solid #0F172A; margin-bottom: 20px; padding-bottom: 10px;">
        <tr>
          <td colspan="2"><h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0 0 15px 0; color: #0F172A;">Rapport des Risques</h1></td>
        </tr>
        <tr>
          <td style="width: 50%; padding-bottom: 5px;"><span style="font-size: 11px; color: #64748B;">ÉTUDE:</span> <br/><span style="font-size: 13px; font-weight: bold;">${studyName}</span></td>
          <td style="width: 50%; padding-bottom: 5px;"><span style="font-size: 11px; color: #64748B;">DATE:</span> <br/><span style="font-size: 13px; font-weight: bold;">${formatDate(date)}</span></td>
        </tr>
        <tr>
          <td style="width: 50%;"><span style="font-size: 11px; color: #64748B;">AÉRONEF:</span> <br/><span style="font-size: 13px; font-weight: bold;">${aircraft}</span></td>
          <td style="width: 50%;"><span style="font-size: 11px; color: #64748B;">EXPÉRIMENTATION:</span> <br/><span style="font-size: 13px; font-weight: bold;">${experimentation}</span></td>
        </tr>
      </table>

      <!-- TOP SECTION : MATRIX & CONCLUSION -->
      <table style="width: 100%; margin-bottom: 30px;">
        <tr>
          <td style="width: 45%; vertical-align: top;">
            <div style="font-size: 14px; font-weight: bold; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 10px;">Matrice de Synthèse</div>
            ${matrixHtml}
          </td>
          <td style="width: 55%; vertical-align: top; padding-left: 20px;">
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 6px;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; text-transform: uppercase; color: #0F172A; border-bottom: 1px solid #CBD5E1; padding-bottom: 5px;">Conclusion Globale</h3>
              <div style="font-size: 12px; color: #334155; line-height: 1.5;">
                ${globalSynthesis ? globalSynthesis.replace(/\n/g, '<br/>') : '<i>Aucune conclusion renseignée.</i>'}
              </div>
            </div>
          </td>
        </tr>
      </table>

      <br clear="all" style="page-break-before:always" />

      <!-- DETAIL DES RISQUES -->
      <h2 style="font-size: 18px; font-weight: bold; color: #1E293B; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 20px;">
        Détail des Risques Résiduels
      </h2>

      ${risksHtml}

      <!-- FOOTER -->
      <div style="margin-top: 40px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center;">
        Généré par GrXP le ${new Date().toLocaleDateString('fr-FR')} - ${studyName}
      </div>

    </body>
    </html>
  `;
};

export const downloadHtmlBlob = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
