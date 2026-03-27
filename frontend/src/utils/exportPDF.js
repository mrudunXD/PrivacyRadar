import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates a PDF report from a scan results object.
 * Uses jsPDF + html2canvas to capture a hidden printable DOM element.
 */
export async function exportScanPDF(results) {
  const {
    input, score, breaches = [], platforms = [],
    darkWebHits = 0, narrative = '', timestamp
  } = results;

  // Build a printable HTML string
  const scanDate = timestamp ? new Date(timestamp).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const label = score?.total >= 81 ? 'CRITICAL' : score?.total >= 61 ? 'HIGH RISK' : score?.total >= 41 ? 'MODERATE' : score?.total >= 21 ? 'LOW RISK' : 'MINIMAL RISK';
  const scoreColor = score?.total >= 61 ? '#FF3B3B' : score?.total >= 41 ? '#F59E0B' : '#10B981';

  const reportHTML = `
    <div style="font-family: Arial, sans-serif; color: #1a1a2e; max-width: 720px; padding: 40px; background: #fff;">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 3px solid #00D4FF; padding-bottom:20px; margin-bottom:28px;">
        <div>
          <div style="font-size:22px; font-weight:800; color:#020817; letter-spacing:-0.5px;">⬡ PRIVACYRADAR</div>
          <div style="font-size:11px; color:#888; margin-top:4px;">Digital Exposure Intelligence Report</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; color:#888;">Generated: ${scanDate}</div>
          <div style="font-size:11px; color:#888;">DPDP Act 2023 Compliant · Team CipherX</div>
        </div>
      </div>

      <!-- Score -->
      <div style="display:flex; gap:24px; margin-bottom:28px; align-items:center;">
        <div style="width:100px; height:100px; border-radius:50%; border:8px solid ${scoreColor}; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0;">
          <div style="font-size:28px; font-weight:800; color:${scoreColor};">${score?.total ?? 0}</div>
        </div>
        <div>
          <div style="font-size:20px; font-weight:800; color:${scoreColor};">${label}</div>
          <div style="font-size:13px; color:#555; margin-top:6px;">
            Credentials: ${score?.breakdown?.credentials ?? 0}/35 · PII: ${score?.breakdown?.pii ?? 0}/25 · Dark Web: ${score?.breakdown?.dark_web ?? 0}/25 · Footprint: ${score?.breakdown?.footprint ?? 0}/15
          </div>
          <div style="font-size:13px; color:#555; margin-top:4px;">
            Target: ${input?.value ?? ''} [${(input?.type ?? '').toUpperCase()}]
          </div>
        </div>
      </div>

      <!-- Summary stats -->
      <div style="display:flex; gap:16px; margin-bottom:28px;">
        ${[
          ['Breaches Found', breaches.length, '#FF3B3B'],
          ['Platforms Found', platforms.length, '#00D4FF'],
          ['Dark Web Hits', darkWebHits, '#F59E0B'],
        ].map(([label, val, color]) => `
          <div style="flex:1; border:1px solid #e5e7eb; border-radius:8px; padding:14px; text-align:center;">
            <div style="font-size:26px; font-weight:800; color:${color};">${val}</div>
            <div style="font-size:11px; color:#888; margin-top:4px;">${label}</div>
          </div>
        `).join('')}
      </div>

      <!-- AI Narrative -->
      ${narrative ? `
      <div style="background:#f0f9ff; border-left:4px solid #00D4FF; padding:16px 20px; border-radius:0 8px 8px 0; margin-bottom:28px;">
        <div style="font-size:11px; font-weight:700; color:#0EA5E9; margin-bottom:8px;">🤖 AI RISK ANALYSIS</div>
        <p style="font-size:13px; color:#374151; line-height:1.7; margin:0; font-style:italic;">"${narrative}"</p>
      </div>` : ''}

      <!-- Breaches -->
      ${breaches.length > 0 ? `
      <div style="margin-bottom:28px;">
        <h2 style="font-size:15px; font-weight:700; border-bottom:1px solid #e5e7eb; padding-bottom:8px; margin-bottom:16px;">DATA BREACHES (${breaches.length})</h2>
        ${breaches.map(b => `
          <div style="border:1px solid #e5e7eb; border-radius:8px; padding:14px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-weight:700; font-size:14px;">${b.name}</div>
              <div style="font-size:11px; font-weight:700; color:${b.severity === 'CRITICAL' ? '#FF3B3B' : b.severity === 'HIGH' ? '#F59E0B' : '#0EA5E9'}; background: ${b.severity === 'CRITICAL' ? '#FEE2E2' : b.severity === 'HIGH' ? '#FEF3C7' : '#DBEAFE'}; padding:2px 8px; border-radius:12px;">${b.severity}</div>
            </div>
            <div style="font-size:12px; color:#888; margin-top:4px;">${new Date(b.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })} · ${b.records} records</div>
            <div style="font-size:12px; color:#555; margin-top:6px;">Exposed: ${(b.data_types || b.dataTypes || []).join(', ')}</div>
          </div>
        `).join('')}
      </div>` : ''}

      <!-- Platforms -->
      ${platforms.length > 0 ? `
      <div style="margin-bottom:28px;">
        <h2 style="font-size:15px; font-weight:700; border-bottom:1px solid #e5e7eb; padding-bottom:8px; margin-bottom:12px;">PLATFORM PRESENCE (${platforms.length})</h2>
        <p style="font-size:12px; color:#555;">${platforms.join(' · ')}</p>
      </div>` : ''}

      <!-- Footer -->
      <div style="border-top:1px solid #e5e7eb; padding-top:16px; font-size:11px; color:#888; text-align:center;">
        Generated by PrivacyRadar · CIPHATHO 26' · Team CipherX · CIPH-PS-007<br/>
        This report is generated in accordance with DPDP Act 2023 · Not stored · Confidential
      </div>
    </div>
  `;

  // Inject into a hidden container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed; left:-9999px; top:0; z-index:-1; background:#fff;';
  container.innerHTML = reportHTML;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container.firstElementChild, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const safeName = (input?.value ?? 'scan').replace(/[^a-z0-9]/gi, '_').slice(0, 20);
    pdf.save(`PrivacyRadar_Report_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
