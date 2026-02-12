'use strict';

import { find_cpw_run_logs_today, find_cpw_run_logs_by_date_range } from './cpw.functions.js';
import { generate_cpw_daily_report_html } from './cpw.emailTemplate.js';
import { sendEmailReport } from '../../rpa/citizens/emailHelper.js';

/** Recipients from env (same as cron) */
const getReportRecipients = () =>
    (process.env.CPW_REPORT_EMAIL_RECIPIENTS || 'dinesh@insuredmine.com')
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

/**
 * GET /api/rpa/carrier-payments/report/test
 * Returns today's logs as JSON. Optional query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export const cpw_report_test_json = async (req, res) => {
    try {
        const { start_date, end_date } = req.query ?? {};
        let logs;

        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            logs = await find_cpw_run_logs_by_date_range(start, end);
        } else {
            logs = await find_cpw_run_logs_today();
        }

        res.status(200).json({
            success: true,
            log_count: logs?.length ?? 0,
            logs: logs ?? []
        });
    } catch (error) {
        console.error('[CPW Report Test] JSON error:', error);
        res.status(500).json({ success: false, message: error?.message ?? 'Failed to fetch logs' });
    }
};

/**
 * GET /api/rpa/carrier-payments/report/test/html
 * Returns the generated HTML report for preview. Optional query: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 */
export const cpw_report_test_html = async (req, res) => {
    try {
        const { start_date, end_date } = req.query ?? {};
        let logs;

        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            logs = await find_cpw_run_logs_by_date_range(start, end);
        } else {
            logs = await find_cpw_run_logs_today();
        }

        const html = generate_cpw_daily_report_html(logs ?? []);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (error) {
        console.error('[CPW Report Test] HTML error:', error);
        res.status(500).json({ success: false, message: error?.message ?? 'Failed to generate report' });
    }
};

/**
 * POST /api/rpa/carrier-payments/report/test/send
 * Sends the report email (same as email cron). Optional body: { start_date, end_date } for date range.
 */
export const cpw_report_test_send = async (req, res) => {
    try {
        const { start_date, end_date } = req.body ?? req.query ?? {};
        let logs;

        if (start_date && end_date) {
            const start = new Date(start_date);
            const end = new Date(end_date);
            logs = await find_cpw_run_logs_by_date_range(start, end);
        } else {
            logs = await find_cpw_run_logs_today();
        }

        if (!logs?.length) {
            return res.status(200).json({
                success: true,
                sent: false,
                log_count: 0,
                message: 'No logs for the given date range. Nothing to send.'
            });
        }

        const html = generate_cpw_daily_report_html(logs);
        const reportDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        await sendEmailReport({
            to: getReportRecipients(),
            subject: `RPA Carrier Payments Report (Test) - ${reportDate}`,
            mailData: html
        });

        res.status(200).json({
            success: true,
            sent: true,
            log_count: logs.length,
            recipients: getReportRecipients()
        });
    } catch (error) {
        console.error('[CPW Report Test] Send error:', error);
        res.status(500).json({ success: false, message: error?.message ?? 'Failed to send report' });
    }
};
