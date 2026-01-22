
export const generateEmailHTML = (report, executionTime = null) => {
    if (!report || !Array.isArray(report) || report.length === 0) {
        return generateErrorHTML("No report data available");
    }

    const dateTime = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Calculate summary statistics
    const totalPolicies = report.length;
    const inForce = report.filter(r => r.status === 'IN FORCE').length;
    const inForceRecheck = report.filter(r => r.status === 'IN FORCE (RECHECK)').length;
    const completed = inForce + inForceRecheck; // Total completed policies
    const errored = report.filter(r => r.status === 'ERROR' || r.status === 'Error/Not Found').length;
    const lost = report.filter(r => r.status === 'LOST').length;
    const assumed = report.filter(r => r.status === 'IN FORCE' && r.integrity === 'ASSUMED').length;
    const paymentPending = report.filter(r => r.status === 'Payment pending carrier selection pending').length;
    const paid = report.filter(r => r.isPaid === true).length;
    const unpaid = report.filter(r => r.isPaid === false && r.status === 'IN FORCE').length;

    // Generate table rows
    const tableRows = report.map((item, index) => {
        // Status highlighting: Error, Lost, Payment Pending, and Recheck should be highlighted
        const statusClass = (
            item.status === 'ERROR' || 
            item.status === 'Error/Not Found' || 
            item.status === 'LOST' ||
            item.status === 'Payment pending carrier selection pending' ||
            item.status === 'IN FORCE (RECHECK)'
        ) ? 'error-cell' : '';
        
        // Integrity highlighting: Assumed should be highlighted
        const integrityClass = (item.integrity && item.integrity === 'ASSUMED') ? 'error-cell' : '';
        
        // Balance highlighting: Non-zero balance should be highlighted
        const balanceClass = item.balance && parseFloat(item.balance.replace(/[^0-9.]/g, '')) > 0 ? 'error-cell' : '';

        return `
            <tr>
                <td class="sno-cell">${index + 1}</td>
                <td class="name-cell">${escapeHtml(item.policy_number || 'N/A')}</td>
                <td class="${statusClass}">${escapeHtml(item.status || 'N/A')}</td>
                <td class="${integrityClass}">${escapeHtml(item.integrity || 'N/A')}</td>
                <td class="${balanceClass}">${escapeHtml(item.balance || 'N/A')}</td>
                <td>${item.isPaid ? 'Yes' : 'No'}</td>
                <td>${item.isAssumed ? 'Yes' : 'No'}</td>
            </tr>
        `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 4px;
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .summary-section {
            margin-bottom: 30px;
        }
        .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 14px;
        }
        th {
            background-color: #1e3a8a;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
        }
        td {
            padding: 10px 8px;
            border: 1px solid #ddd;
            background-color: #f8f9fa;
        }
        .sno-cell {
            background-color: #e3f2fd;
            font-weight: bold;
            text-align: center;
            width: 60px;
        }
        .name-cell {
            background-color: #e3f2fd;
            font-weight: 500;
        }
        .error-cell {
            background-color: #ffebee;
            color: #c62828;
            font-weight: 500;
        }
        .summary-table th {
            background-color: #1e3a8a;
        }
        .summary-table td {
            background-color: #f8f9fa;
            text-align: center;
        }
        .summary-table .label-cell {
            background-color: #e3f2fd;
            font-weight: bold;
            text-align: left;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RPA Audit Report - Citizens</h1>
        <div class="timestamp">Generated on: ${dateTime}${executionTime ? ` | Execution Time: ${executionTime}ms` : ''}</div>
        
        <div class="summary-section">
            <div class="summary-title">Summary</div>
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="label-cell">Total Policies</td>
                        <td>${totalPolicies}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">IN FORCE</td>
                        <td>${inForce}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">IN FORCE (RECHECK)</td>
                        <td class="${inForceRecheck > 0 ? 'error-cell' : ''}">${inForceRecheck}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Completed (Total)</td>
                        <td>${completed}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Lost (Non-Renewal)</td>
                        <td class="${lost > 0 ? 'error-cell' : ''}">${lost}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Assumed</td>
                        <td class="${assumed > 0 ? 'error-cell' : ''}">${assumed}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Payment Pending</td>
                        <td class="${paymentPending > 0 ? 'error-cell' : ''}">${paymentPending}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Paid</td>
                        <td>${paid}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Unpaid</td>
                        <td class="${unpaid > 0 ? 'error-cell' : ''}">${unpaid}</td>
                    </tr>
                    <tr>
                        <td class="label-cell">Errored</td>
                        <td class="${errored > 0 ? 'error-cell' : ''}">${errored}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="summary-section">
            <div class="summary-title">Policy Audit Details</div>
            <table>
                <thead>
                    <tr>
                        <th>S.No.</th>
                        <th>Policy Number</th>
                        <th>Status</th>
                        <th>Integrity</th>
                        <th>Balance</th>
                        <th>Payment Paid</th>
                        <th>Policy Assumed</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
    `;

    return html;
};

export const generateErrorHTML = (errorMessage) => {
    const dateTime = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 4px;
        }
        h1 {
            color: #c62828;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .error-message {
            background-color: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #c62828;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RPA Audit Report - Citizens (Error)</h1>
        <div class="timestamp">Generated on: ${dateTime}</div>
        <div class="error-message">
            <strong>Error:</strong> ${escapeHtml(errorMessage)}
        </div>
    </div>
</body>
</html>
    `;
};

const escapeHtml = (text) => {
    if (text === null || text === undefined) return 'N/A';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
};
