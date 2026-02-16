'use strict';

/** modules */
import cron from "node-cron";

/** collection services */
import { find_one_agencies, distinct_agencies } from '../../Database/Services/PrimaryDB/agencies.services.js';
import { distinct_company_ids } from '../../Database/Services/PrimaryDB/companies.services.js';
import { find_one_renewal_automation_settings } from '../../Database/Services/PrimaryDB/renewal_automation_settings.services.js';
import { create_cpw_run_log, find_cpw_run_logs_today } from './cpw.functions.js';

/** functions */
import {
    get_agencies_with_rpa_creds,
    get_dealboard_id_for_cpw,
    normalize_dealboard_ids,
    ObjectId
} from './cpw.functions.js';

import { cpw_controller } from './cpw.controller.js';
import { sendEmailReport } from '../../rpa/citizens/emailHelper.js';
import { generate_cpw_daily_report_html } from './cpw.emailTemplate.js';

/** constants */
import { ENABLE_CRONS } from "../../Constants.js";
import { CPW_REPORT_RECIPIENTS } from "./cpw.constants.js";

/**
 * Daily CPW Cron: Process each agency with rpa_creds, run carrier payments workflow, save logs.
 * Runs once per day. Processes agencies sequentially.
 */
export const run_cpw_daily_cron = async () => {
    console.log('[CPW Cron] Starting daily CPW run...');
    const start = Date.now();

    try {
        const agencies = await get_agencies_with_rpa_creds();
        if (!agencies?.length) {
            console.log('[CPW Cron] No agencies with rpa_creds found. Exiting.');
            return { success: true, processed: 0, message: 'No agencies with rpa_creds' };
        }

        let logs_saved = 0;
        const errors = [];

        for (const { agency_id, agency_name, agency_doc, carriers } of agencies) {
            for (const { carrier_name, rpa_creds } of carriers) {
                try {
                    const agency_ids_for_carriers =
                        agency_doc.isParentGroupAgency === true
                            ? await distinct_agencies('_id', {
                                  parentGroupAgencyId: new ObjectId(agency_id),
                                  archived: false
                              })
                            : [new ObjectId(agency_id)];

                    const carrier_filter = {
                        agency_id:
                            agency_ids_for_carriers.length === 1
                                ? agency_ids_for_carriers[0]
                                : { $in: agency_ids_for_carriers },
                        archived: false,
                        company_name: new RegExp(
                            String(carrier_name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                            'i'
                        )
                    };

                    const carrier_ids = await distinct_company_ids(carrier_filter);
                    const carrier_ids_normalized = (carrier_ids ?? [])
                        .map((id) => (id?.toString ? id.toString() : id))
                        .filter(Boolean);

                    if (carrier_ids_normalized.length === 0) {
                        console.log(`[CPW Cron] Agency ${agency_id} | ${carrier_name}: No carriers found. Skipping.`);
                        continue;
                    }

                    const renewal_settings = await find_one_renewal_automation_settings({
                        agency_id: new ObjectId(agency_id),
                        isRenewalAutomationEnabled: true
                    });

                    let dealboard_ids = get_dealboard_id_for_cpw(agency_doc, renewal_settings);
                    if (!dealboard_ids?.length && agency_doc.default_Renewal_board) {
                        dealboard_ids = normalize_dealboard_ids(agency_doc.default_Renewal_board);
                    }

                    if (!dealboard_ids?.length) {
                        console.log(`[CPW Cron] Agency ${agency_id} | ${carrier_name}: No dealboard. Skipping.`);
                        continue;
                    }

                    console.log(`[CPW Cron] Processing agency ${agency_id} (${agency_name}) | carrier: ${carrier_name}`);

                    const run_result = await cpw_controller(
                        agency_id,
                        carrier_ids_normalized,
                        dealboard_ids,
                        { username: rpa_creds.username, password: rpa_creds.password },
                        carrier_name
                    );

                    if (!run_result.run_ended_at) {
                        run_result.run_ended_at = new Date().toISOString();
                    }

                    await create_cpw_run_log(run_result, new Date(run_result.run_ended_at));
                    logs_saved += 1;

                    console.log(
                        `[CPW Cron] Saved log | agency ${agency_id} | ${carrier_name} | policies: ${run_result.policies_processed_count}`
                    );
                } catch (err) {
                    console.error(`[CPW Cron] Error processing agency ${agency_id} | ${carrier_name}:`, err);
                    errors.push({ agency_id, carrier_name, error: err?.message ?? String(err) });
                }
            }
        }

        const duration_ms = Date.now() - start;
        console.log(`[CPW Cron] Completed. Logs saved: ${logs_saved} | Duration: ${duration_ms}ms`);

        return {
            success: errors.length === 0,
            processed: logs_saved,
            errors: errors.length > 0 ? errors : undefined,
            duration_ms
        };
    } catch (error) {
        console.error('[CPW Cron] Fatal error:', error);
        throw error;
    }
};

/**
 * Email Cron: Fetch today's logs and send email report.
 * Runs separately from the daily processing cron.
 */
export const run_cpw_email_cron = async () => {
    console.log('[CPW Email Cron] Fetching today\'s logs...');

    try {
        const logs = await find_cpw_run_logs_today();

        if (!logs?.length) {
            console.log('[CPW Email Cron] No logs for today. Skipping email.');
            return { success: true, sent: false, message: 'No logs for today' };
        }

        const html = generate_cpw_daily_report_html(logs);
        const reportDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        await sendEmailReport({
            to: CPW_REPORT_RECIPIENTS,
            subject: `RPA Carrier Payments Report - ${reportDate}`,
            mailData: html
        });

        console.log(`[CPW Email Cron] Report sent to ${CPW_REPORT_RECIPIENTS.join(', ')}`);

        return { success: true, sent: true, log_count: logs.length };
    } catch (error) {
        console.error('[CPW Email Cron] Error:', error);
        throw error;
    }
};



/** CPW crons (when ENABLE_CRONS) */
if (ENABLE_CRONS) {   
    cron.default.schedule("13 12 * * *", () => run_cpw_daily_cron().catch(console.error)); 
    cron.default.schedule("00 13 * * *", () => run_cpw_email_cron().catch(console.error));  
    console.info("\nCPW Crons: Daily 12:00 UTC | Email 13:00 UTC");
}