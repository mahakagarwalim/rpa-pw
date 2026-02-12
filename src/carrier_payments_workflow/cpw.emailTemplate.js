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
                    <td class="${statusClass}">${escapeHtml(p.enum || '–')}</td>
                    <td>${escapeHtml(p.balance || '–')}</td>
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
                            <th>Balance</th>
                            <th>Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${policyRows || '<tr><td colspan="6">No policy details</td></tr>'}
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
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px 24px;
        }
        .header {
            margin-bottom: 32px;
            padding: 20px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .header-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #0ea5e9;
            margin-bottom: 8px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 6px 0;
            color: #0f172a;
        }
        .subtitle {
            color: #64748b;
            font-size: 14px;
        }
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }
        .card {
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
        }
        .card .label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 6px;
            font-weight: 500;
        }
        .card .value {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
        }
        .section-title {
            font-size: 16px;
            font-weight: 600;
            margin: 32px 0 16px 0;
            color: #0f172a;
            padding-left: 12px;
            border-left: 4px solid #0ea5e9;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        th {
            background: #f1f5f9;
            color: #475569;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        tbody tr:hover td {
            background: #f8fafc;
        }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .mono { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 11px; color: #64748b; }
        .error-cell { color: #dc2626; font-weight: 500; }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .badge-success { background: #dcfce7; color: #16a34a; }
        .badge-error { background: #fee2e2; color: #dc2626; }
        .agency-section {
            margin-bottom: 24px;
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .agency-heading {
            font-size: 14px;
            font-weight: 600;
            padding: 16px 20px;
            margin: 0;
            background: #f8fafc;
            color: #334155;
            border-left: 4px solid #0ea5e9;
        }
        .policy-table { margin: 0; border-radius: 0; }
        .policy-table th { font-size: 11px; color: #64748b; }
        .policy-table td { padding: 10px 20px; }
        .footer {
            margin-top: 40px;
            padding: 20px 0;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
        }
        @media (max-width: 640px) {
            .summary-cards { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <span class="header-badge">Daily Report</span>
            <h1>RPA Carrier Payments Report</h1>
            <p class="subtitle">Generated on ${formatDate(new Date())} · Report date: ${reportDate}</p>
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
                    <th class="num">Dealcards</th>
                    <th class="num">Policies</th>
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
