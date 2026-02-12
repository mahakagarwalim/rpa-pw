'use strict';

const escapeHtml = (text) => {
    if (text === null || text === undefined) return '–';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
};

const formatDate = (d) => {
    if (!d) return '–';
    const x = new Date(d);
    return x.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Generate modern HTML email for CPW daily report.
 * @param {Array} logs - CPW run logs from find_cpw_run_logs_today
 */
export const generate_cpw_daily_report_html = (logs) => {
    const reportDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const totalPolicies = logs.reduce((acc, l) => acc + (l.total_policies ?? 0), 0);
    const totalRuns = logs.length;
    const successRuns = logs.filter((l) => l.success).length;

    let overallTableRows = '';
    for (const log of logs) {
        const statusBadge = log.success
            ? '<span class="badge badge-success">Success</span>'
            : '<span class="badge badge-error">Failed</span>';
        overallTableRows += `
            <tr>
                <td>${escapeHtml(log.agency_id)}</td>
                <td>${escapeHtml(log.agency_name || '–')}</td>
                <td>${formatDate(log.report_date)}</td>
                <td>${escapeHtml(log.carrier_name || '–')}</td>
                <td class="num">${log.total_dealcards ?? 0}</td>
                <td class="num">${log.total_policies ?? 0}</td>
                <td class="mono">${escapeHtml(log.session_id || '–')}</td>
                <td>${log.duration_formatted || '–'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }

    let agencyReportSections = '';
    for (const log of logs) {
        const details = log.policy_details || [];
        let policyRows = '';
        for (const p of details) {
            const statusClass =
                ['assumed', 'unpaid', 'error', 'check'].includes((p.enum || '').toLowerCase())
                    ? 'error-cell'
                    : '';
            policyRows += `
                <tr>
                    <td class="mono">${escapeHtml(p.dealcard_id || '–')}</td>
                    <td class="mono">${escapeHtml(p.insurance_id || '–')}</td>
                    <td class="mono">${escapeHtml(p.policy_number || '–')}</td>
                    <td class="${statusClass}">${escapeHtml(p.status || p.enum || '–')}</td>
                    <td>${escapeHtml(p.notes || '–')}</td>
                </tr>
            `;
        }

        agencyReportSections += `
            <div class="agency-section">
                <h3 class="agency-heading">
                    Agency: ${escapeHtml(log.agency_name || log.agency_id)} | 
                    Session: ${escapeHtml(log.session_id || '–')} | 
                    Carrier: ${escapeHtml(log.carrier_name || '–')}
                </h3>
                <table class="policy-table">
                    <thead>
                        <tr>
                            <th>Dealcard ID</th>
                            <th>Policy ID</th>
                            <th>Policy Number</th>
                            <th>Status</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${policyRows || '<tr><td colspan="5">No policy details</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPA Carrier Payments Report</title>
    <style>
        :root {
            --bg: #0f172a;
            --surface: #1e293b;
            --accent: #3b82f6;
            --accent-dim: #60a5fa;
            --text: #f1f5f9;
            --text-muted: #94a3b8;
            --success: #22c55e;
            --error: #ef4444;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 24px;
            background: var(--bg);
            color: var(--text);
            line-height: 1.5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px 0;
            background: linear-gradient(135deg, var(--accent-dim), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: var(--text-muted);
            font-size: 14px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .card {
            background: var(--surface);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .card .label {
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .card .value {
            font-size: 24px;
            font-weight: 700;
            color: var(--accent-dim);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            background: var(--surface);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.06);
        }
        th {
            background: rgba(59, 130, 246, 0.15);
            color: var(--accent-dim);
            padding: 14px 16px;
            text-align: left;
            font-weight: 600;
        }
        td {
            padding: 12px 16px;
            border-radius: 0;
        }
        tr:not(:last-child) td {
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        tr:hover td {
            background: rgba(255,255,255,0.02);
        }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .mono { font-family: 'SF Mono', Monaco, monospace; font-size: 12px; }
        .error-cell { color: var(--error); }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .badge-error { background: rgba(239, 68, 68, 0.2); color: var(--error); }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin: 32px 0 16px 0;
            color: var(--text);
        }
        .agency-section {
            margin-bottom: 32px;
            background: var(--surface);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.06);
        }
        .agency-heading {
            font-size: 14px;
            font-weight: 600;
            padding: 16px 20px;
            margin: 0;
            background: rgba(59, 130, 246, 0.1);
            color: var(--accent-dim);
        }
        .policy-table { margin: 0; border-radius: 0; }
        .policy-table th { font-size: 12px; }
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RPA Carrier Payments Report</h1>
            <p class="subtitle">Generated on ${formatDate(new Date())} • Report date: ${reportDate}</p>
        </div>

        <div class="summary-cards">
            <div class="card">
                <div class="label">Total Runs</div>
                <div class="value">${totalRuns}</div>
            </div>
            <div class="card">
                <div class="label">Successful Runs</div>
                <div class="value">${successRuns}</div>
            </div>
            <div class="card">
                <div class="label">Total Policies</div>
                <div class="value">${totalPolicies}</div>
            </div>
        </div>

        <div class="section-title">Overall Analysis</div>
        <table>
            <thead>
                <tr>
                    <th>Agency ID</th>
                    <th>Agency Name</th>
                    <th>Date Report Ran</th>
                    <th>Carrier</th>
                    <th class="num">Total Dealcards</th>
                    <th class="num">Total Policies</th>
                    <th>Session ID</th>
                    <th>Duration</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${overallTableRows}
            </tbody>
        </table>

        <div class="section-title">Agency Wise : Carrier Report</div>
        ${agencyReportSections}

        <div class="footer">
            <p>This report is generated automatically by the RPA Carrier Payments Workflow.</p>
        </div>
    </div>
</body>
</html>
`;

    return html;
};
