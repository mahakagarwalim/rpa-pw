/** modules */
import mongoose from "mongoose";

/** db connection */
import { primary_connection } from "../../database.config.js";


/** Intialization */
const Schema = mongoose.Schema;

const AgencySchema = new Schema({
    insurence: {
        type: Schema.ObjectId,
        ref: 'Insurance'
    },
    isUseLoggedInUserForAMS360Sync: {
        type: Boolean,
        default: true
    },
    redirectSMS: {
        type: Boolean,
        default: false
    },
    show_add_task_when_task_done: {
        type: Boolean,
        default: false
    },
    defaultAgent: { type: Schema.ObjectId, ref: 'Agents' }, /** added this agent for thames*/
    amsSyncControlls: {
        type: Array
    },
    agency_support_phone: String,
    agency_icon: String, /**Agency logo. It is used to whitelisting their communication like emails and also visible to their public web page provided by insuredmine */
    agency_name: {
        type: String, /**Name of the agency */
    },
    agency_alias_name: {
        type: String, /**Alias Name of the agency. This will be used by the SR */
    },
    publicQuotesheetURL: {
        type: String
    },
    externalNewLeadNotification: {
        type: Boolean,
        default: false
    },
    agent_phoneNo: {
        type: String, /** Not in use. */
    },
    agency_phoneNo: {
        type: String, /**Phone number to contact agency support */
    },
    salesforceTokenGetApi: {
        type: String     /**There are some salesforce based  CRM used  by agency to manage their Insurance data. It store the token for their system integration */
    },
    salsforceActivePolicyApi: {
        type: String
    },
    salesforceActiveClientsApi: {
        type: String
    },
    agency_address: {
        type: String /**Address of the agency headquarter */
    },
    agency_website: {
        type: String /**Current running website */
    },
    facebookId: {
        type: String /**Facebook page link */
    },
    agencytoken: {
        type: String
    },
    v2Company: {
        type: Boolean,
        default: false
    },
    v2Category: {
        type: Boolean,
        default: false
    },
    twitterId: {
        type: String
    },
    linkedinId: {
        type: String
    },
    interest: {
        type: String
    },
    agency_email: {
        type: String
    },
    lightspeedServerInfo: {
        server: String,
        connected: Boolean
    },
    user_agreement: String,
    spam_agreement: String,
    cancellation_policy: String,
    agency_support_email: {
        type: String   /**Support email */
    },
    about_us: String,
    coverage_provide: [
        {
            type: String,  /**Covergae provided by the company. Like Auto/Home/Business etc*/
        }
    ],
    states_served: [
        {
            type: String /**States in which agency provides it's services */
        }
    ],
    companie_represent: [
        {
            type: String /**Carrier for which they sold policies */
        }
    ],
    premium_agency: {
        type: Boolean,
        default: true
    },
    business_hours: [
        {
            type: String
        }
    ],
    subDomain: {
        type: String    /**Subdomai like abc.insuredmine.com to access their agent/customer portal */
    },
    verificationHash: {
        type: String
    },
    domainVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    },
    onboarding_date: {
        type: Date
    },
    appdrip_trigger: {
        type: Boolean,
        default: false   /**Parameter to handle drip email for those who downloads looged in into their app */
    },
    default_stage: {
        type: Schema.ObjectId,
        ref: 'Dealboard'  /**We get propect data from extrnal link resource. Those data will feed into dealboard. This param denotes the deafult deal stage for the agency to push the deal info which comes from external resources */
    },
    default_Renewal_board: {
        type: Schema.ObjectId,
        ref: 'Dealboardinfo'
    },
    default_Renewal_stage: {
        type: Schema.ObjectId,
        ref: 'Dealboard'
    },
    timezone: {
        date_format: {
            type: String,
            default: "MM-dd-yyyy"
        }
    },
    default_board: {
        type: Schema.ObjectId,
        ref: 'Dealboardinfo'  /**Default baord id in which external info pushed */
    },
    customized_Renewal_board: {
        customized: {
            type: Boolean,
            default: false
        },
        personal: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        commercial: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        otherPolicy: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        sharable: {
            type: Boolean,
            default: false
        }
    }, /** customized renewal board for personal and commercial */
    customized_Renewal_stage: {
        customized: {
            type: Boolean,
            default: false
        },
        personal: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        },
        commercial: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        },
        otherPolicy: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        }
    }, /** customized renewal stage for personal and commercial */
    isRenewalAutomationEnabled: {
        type: Boolean,
        default: true
    }, // To Enable Renewal Automation
    isSubmissionAutomationEnabled: {
        type: Boolean,
        default: true
    }, // To Enable Submission Automation
    additionalRenewalAutomationSettings: {
        createOneCardPerUser: {
            type: Boolean,
            default: false
        },
        personalPolicies: {
            daysForRenewalAutomation: {
                type: Number,
                default: 60
            },
            assignAgent: {
                type: String,
                enum: ["policyAgent", "customAgent", "executive", "representative"],
                default: "policyAgent"
            },
            customAgentForRenewalAutomation: {
                type: Schema.ObjectId,
                ref: 'Agents'
            },
            isCustomizedBoard: {
                type: Boolean,
                default: false
            },
            isSharable: {
                type: Boolean,
                default: false
            },
            customRenewalBoard: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            customRenewalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
        commercialPolicies: {
            daysForRenewalAutomation: {
                type: Number,
                default: 60
            },
            assignAgent: {
                type: String,
                enum: ["policyAgent", "customAgent", "executive", "representative"],
                default: "policyAgent"
            },
            customAgentForRenewalAutomation: {
                type: Schema.ObjectId,
                ref: 'Agents'
            },
            isCustomizedBoard: {
                type: Boolean,
                default: false
            },
            isSharable: {
                type: Boolean,
                default: false
            },
            customRenewalBoard: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            customRenewalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
        otherPolicies: {
            daysForRenewalAutomation: {
                type: Number,
                default: 60
            },
            assignAgent: {
                type: String,
                enum: ["policyAgent", "customAgent", "executive", "representative"],
                default: "policyAgent"
            },
            customAgentForRenewalAutomation: {
                type: Schema.ObjectId,
                ref: 'Agents'
            },
            isCustomizedBoard: {
                type: Boolean,
                default: false
            },
            isSharable: {
                type: Boolean,
                default: false
            },
            customRenewalBoard: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            customRenewalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
    },
    daysForRenewalAutomation: {
        type: Number,
        default: 60
    }, /**How  many days before the expiration date of policy */
    agentForRenewalAutomation: {
        type: Schema.ObjectId,
        ref: 'Agents'
    }, /** cards of renewal automation should be created for which agent */
    customAgentForRenewalAutomation: {
        executive: {
            type: Boolean,
            default: false
        },
        representative: {
            type: Boolean,
            default: false
        }
    },
    retensionSetting: {
        archiveRetensionCard: {
            type: Number
        }, /** after how many days of policy expiration date retension card should archive*/
        archiveCard: {
            type: Object
        }, /** added for frontend requirement */
        won_archive_card_if_prior_policy: {
            personal: {
                type: String,
                enum: ['nothing', 'archive', 'won']
            },
            commercial: {
                type: String,
                enum: ['nothing', 'archive', 'won']
            },
            others: {
                type: String,
                enum: ['nothing', 'archive', 'won']
            },
        }
    },
    cancelledPolicyAutomation: {
        isEnabled: {
            type: Boolean,
            required: true,
            default: false
        },
        isSharable: {
            type: Boolean,
            required: true,
            default: false
        },
        defaultCancelledPolicyPipeline: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        defaultCancelledPolicyStage: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        },
        isCustomisedBoardAndStage: {
            type: Boolean,
            default: false
        },
        CustomisedBoardAndStage: {
            personalPipeline: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            personalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            commercialPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            commercialStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            othersPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            othersStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
        agentsToMap: {
            policyAgent: {
                type: Boolean,
                default: false
            },
            executive: {
                type: Boolean,
                default: false
            },
            representative: {
                type: Boolean,
                default: false
            },
            csr: {
                type: Boolean,
                default: false
            },
            execAndRep: {
                type: Boolean,
                default: false
            },
            primaryAgent: {
                type: String,
                enum: ["executive", "representative"],
                default: "executive"
            },
            assignTo: [{
                type: Schema.ObjectId,
                ref: 'Agents'
            }],
            agentMappingForOtherAms: {} /**IM <> AMS sheet agent name mapping*/

        }
    },
    submissionPolicyAutomation: {
        isEnabled: {
            type: Boolean,
            required: true,
            default: false
        },
        isSharable: {
            type: Boolean,
            required: true,
            default: false
        },
        defaultSubmissionPolicyPipeline: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        defaultSubmissionPolicyStage: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        },
        isCustomisedBoardAndStage: {
            type: Boolean,
            default: false
        },
        CustomisedBoardAndStage: {
            personalPipeline: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            personalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            commercialPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            commercialStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            othersPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            othersStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
        agentsToMap: {
            policyAgent: {
                type: Boolean,
                default: false
            },
            executive: {
                type: Boolean,
                default: false
            },
            representative: {
                type: Boolean,
                default: false
            },
            assignTo: [{
                type: Schema.ObjectId,
                ref: 'Agents'
            }]
        },

    },
    dailySync: { type: Boolean, default: true }, //Parameters to stop dailysync for existing QQ customer on whom QQ  ID's not mapped
    dailySync_v2: { type: Boolean },
    lastDailySync: {
        type: Date
    },
    get_quotes: {
        type: Boolean,
        default: false
    },
    extraParams: {},
    stripeDetails: {
        type: Object
    },
    licence_count: Number,
    paid_amount: Number,
    country_code: {
        type: String,
        default: "+1"
    },
    premium_feature: {
        type: Object    /**Not in use as of now */
    },
    isSecureRisk: {
        type: Boolean,
        default: false
    },
    amsLink: String, /**From whihc AMS agency currently linked */
    ams360APICreds: {  /**AMS360 is an ams. To access data through API we use these creds */
        type: Object
    },
    amsInfo: {
        type: Schema.ObjectId,
        ref: 'Amsinfo',
    },
    ams360CreateCommericalContactFromCSP: { // when this is true we will create a contact from csp when the first and last name presnt
        type: Boolean,
        default: false
    },
    ams360CreateCommericalContactFromCSPWithoutFirstLastName: { // if this is true then we will create a contact from CSP even when there is no first/last name
        type: Boolean,
        default: false
    },
    isHybridAccountAgency: { // if this is true then the agency used the account hybrid structure
        type: Boolean,
        default: false
    },
    ams360NotificationKey: String,
    ams360PolicyDataRefreshMode: {
        type: String,
        default: 'daily'
    },
    ams360CustomerDataRefreshMode: {
        type: String,
        default: 'normal'
    },
    ams360OnboardEmployeeCodeList: { //this will be useful for the agency notifications from ams360
        type: Array
    },
    ams360OnboardEmployeeMode: { //this will be useful for the agency onboarding
        type: String,
        default: "executive"
    },
    ams360CustomerDirectLink: {
        type: String,
        default: 'https://www.ams360.com/v21117301/NextGen/Customer/Detail/'
    },
    quotesheetfields: String,
    quoteLang: String,
    qqcatalystCreds: {
        type: Object
    },
    qqStatusMappingPageNumber: Number,
    nowCertsCreds: Object,
    sagittaCreds: Object,
    nowCertsAgencyId: String,
    ncFileTransactionStatus: Boolean,
    nowCertsCreds2: {
        type: Object
    },
    syncContactsToAMSAutomatically: {
        type: Boolean,
        required: true,
        default: false
    },
    portalType: String, /**To introduce CRM functionality in portal*/
    /**It is implemented for Rideshare as  they need automatic generation of policy number*/
    automatedPolicyNumber: { type: Boolean, default: false },
    defualtPolicyPrefix: { type: String }, /**prefix for policy number for example -> RIDE */
    lastPolicyNumber: { type: Number, default: 0 }, /**Last policy number increemented - 1204*/

    appDrip: {
        playstoreLink: String,
        iosLink: String
    },
    quotesheetfields: String,
    archived: {
        type: Boolean,
        default: false
    },
    dataUpdatedOn: {
        type: Date
    },
    dataUpdatedOn_V2: {
        type: Date
    },
    dataSyncV2ProducerInprogress: {
        type: Boolean
    },
    archivedAt: {
        type: Date
    },
    archivedReason: {
        type: String
    },
    service_board: [{
        default_stage: Object,
        default_board: Object,
        status: {
            type: String,
            default: "pending"
        }, //verified,pending
        email: {
            type: String
        },
        active: {
            type: Boolean,
            default: true
        },
        agent_id: Object
    }],
    referral: String,
    renewal_pipeline_notification: Boolean,
    add_deal_notification: Boolean,
    on_new_business_notification: Boolean,
    disable_text_notification: Boolean,
    lost_deal_template: {
        type: Schema.ObjectId,
        ref: 'EmailTemplate'
    },
    trackUploadData: {  /**Page Number added upto which syn is done */
        totalData: String,
        uplodedPages: [
            {
                type: Number /**Page Number added upto which syn is done */
            }
        ],
        isCompleted: {
            type: Boolean, /**Wether syncing for agency is completly done or not */
            default: false,
        },
        startDate: {
            type: Date /**From Date when sync is started */
        },
        tillDate: {
            type: Date /** Till Date sync is supposed to be done */
        },
        totalPages: Number
    },
    mandatoryFields: {
        "wonDeals": { type: Object },
        "lostDeals": { type: Object },
        "addDeals": { type: Object },
        "addPolicies": { type: Object },
        "addContact": { type: Object },
        "addGoals": { type: Object },
        "addTask": { type: Object }
    },
    accountExectiveAgent: {
        type: Boolean, /** TRUE=> ams360ExecutiveCode mapping, FALSE=> ams360RepresentativeCode mapping */
        default: true,
    },
    accountEpicProdCodeAgent: {
        type: Boolean, /** TRUE=> epicProducerCode mapping, FALSE=> epicRepCode mapping */
        default: true,
    },
    epicAPICreds: { /**Epic is a WSDL based ams. To access data through API we use these creds */
        type: Object
    },
    epicAPICredsV2: { /**Epic is a WSDL based ams. To access data through API we use these creds */
        client_id: {
            type: String
        },
        token: {
            type: String
        },
        client_secret: {
            type: String
        },

    },

    sign_up_url: {
        type: String
    },
    current_page_url: {
        type: String
    },
    ams360CustomActivityNames: { // can be used for activity and suspense setup in ams360. If this paramter is not available default standars will be used
        imNote: {
            type: String
        },
        imEmail: {
            type: String
        },
        imActivity: {
            type: String
        },
        imAttachment: {
            type: String
        },
        imSMS: {
            type: String
        },
        imTask: {
            type: String
        },
        imQuote: {
            type: String
        },
        imPayment: {
            type: String
        },
        imCall: {
            type: String
        }
    },
    gwic_agency_id: String,
    ams360FileUploadSecurityLevel: { // used for the file uploading security level customize since the file can be uploaded with any security level based on the requirement
        type: String
    },
    pipeline_automation_version: String,
    hsCreds: Object,
    hsAgency_id: String,
    hsAgentInitialsToMap: [{
        type: String
    }],
    hsSyncBackEnabled: {
        type: Boolean,
        default: false
    },
    hsSyncBackCreds: {
        type: Object
    },
    hsSyncBackOptions: {
        syncNotes: {
            type: Boolean,
            default: false
        },
        syncSMS: {
            type: Boolean,
            default: false
        },
        syncCallLogs: {
            type: Boolean,
            default: false
        },
        syncEmails: {
            type: Boolean,
            default: false
        },
        syncTasks: {
            type: Boolean,
            default: false
        },
        syncAttachments: {
            type: Boolean,
            default: false
        },
        syncActivities: {
            type: Boolean,
            default: false
        }
    },
    hsofficeIdsToMap: [{
        type: Number
    }],
    hsCustomDataSyncFrequency: {
        type: Boolean,
        default: false
    },
    hsSyncActionType: {
        notes: {
            type: Number,
            default: 32
        },
        sms: {
            type: Number,
            default: 32
        },
        callLogs: {
            type: Number,
            default: 32
        },
        emails: {
            type: Number,
            default: 32
        },
        tasks: {
            type: Number,
            default: 32
        },
        attachments: {
            type: Number,
            default: 32
        },
        activities: {
            type: Number,
            default: 32
        }
    },
    dailySyncCompletedAt: {
        type: Date
    },

    // QuoteRush ==>
    isDistinctAgentCreds: {
        type: Boolean,
        required: true,
        default: false
    },
    isQuoteRushEnabled: {
        type: Boolean,
        required: true,
        default: false
    },
    quoteRushCreds: {
        webId: {
            type: String,
            trim: true
        },
        webPassword: {
            type: String,
            trim: true
        }
    },
    // <== QuoteRush

    // PL Rater ==>
    // isPlRaterEnabled: {
    //   type: Boolean,
    //   required: true,
    //   default: false
    // },
    // plRaterCreds: {
    //   spName: {
    //     type: String
    //   },
    //   accountId: {
    //     type: Number
    //   },
    //   orgName: {
    //     type: String
    //   }
    // },
    // <== PL Rater

    // ContactUpdate Form ==>
    contactUpdateFormTags: [{
        tag: {
            type: String,
            trim: true
        },
        agentForm: {
            type: Schema.ObjectId,
            ref: "Agentforms"
        },
        agentId: {
            type: Schema.ObjectId,
            ref: 'Agents'
        }
    }],
    slyBroadCast: {
        type: Object
    },
    thanksio: {
        type: Object
    },
    tranzPay: {
        username: String,
        password: String,
        producerId: Number
    },
    google_mybusiness: {},
    restricted_pipelines_for_stage_change: [],
    restricted_pipelines_for_won: [],
    recapNotifications: {
        isEnabled: {
            type: Boolean,
            default: false
        },
        daily: {
            type: Boolean,
            default: false
        },
        weekly: {
            type: Boolean,
            default: false
        },
        monthly: {
            type: Boolean,
            default: false
        },
        agentsToReceiveEmails: [{
            type: Schema.ObjectId,
            ref: 'Agents'
        }],
        notificationTimingsInCST: [{
            hour: {
                type: Number,
                min: 0,
                max: 23
            },
            minute: {
                type: Number,
                min: 0,
                max: 59
            }
        }]
    },
    childAgencyList: [{
        type: Schema.ObjectId,
        ref: 'ChildAgencyData'
    }],
    isChildSegregatedAgency: {
        type: Boolean,
        default: false
    },
    dataSegmentMode: {
        type: String // division/department/branch/group
    },
    isProcessingNeededForExceptChildAgencyData: {
        type: Boolean, // indicate we should not process data which is beyond child agency associated data
        default: false // if this is false then except for child agency valid data we should not process any data
    },
    parentAgencyId: {
        type: Schema.ObjectId,
        ref: 'Agency'
    },
    childAgencyDataId: { // store the child agency data schema id here
        type: Schema.ObjectId,
        ref: 'ChildAgencyData'
    },
    // for parent and child
    epicParentChildSegregatedMode: {
        type: String
    },

    // for child
    epicParentAgencyId: {
        type: Schema.ObjectId,
        ref: 'Agency'
    },
    
    // for parent
    epicChildAgencyIdList: [{
        type: Schema.ObjectId,
        ref: 'Agency'
    }],
    isEpicRestSDKEnabled: {
        type: Boolean
    },
    isClientV2SyncEnabled: {
        type: Boolean
    },
    // EPIC policy status codes at agency level specific to agency
    epicV2ActivePolicyStatusCodes: {
        type: Array,
        // default: [ 'REN', 'REW' ,'NEW' ,'MKT', 'REI', 'ACT' ],
    },

    epicV2InactivePolicyStatusCodes: {
        type: Array,
        // default: [ 'CAN' ,'CIR' ,'CNP' ,'CRW' ,'NNC' ,'ECU' ,'NNI' ,'NRC' ,'NRI' ,'LAP' ,'SYN'],
    },

    epicV2QuotePolicyStatusCodes: {
        type: Array,
        // default: [ 'QNT', 'NWQ']
    },

    epicV2ReservedCancelledPolicyCodes: {
        type: Array,
        // default: ['CAN', 'CIR', 'CNP', 'CRW', 'ECU']
    },

    epicV2NonRenewedPolicyCodes: {
        type: Array,
        // default: ['NNC', 'NNI', 'NRC', 'NRI']
    },

    epicV2CancelledRewrittenPolicyCodes: {
        type: Array,
        // default: ['CRW']
    },
    epicChildAgencyBranchCodes: {
        type: Array
    },
    epicV2FileSyncDefaultAccessLevelId: {
        type: String
    },
    isEpicFileV2SyncEnabled: {
        type: Boolean
    },
    aggregatorName: String,
    agencyType: String,
    /**BenefitPoint integration fields */
    benefitPoint: {
        creds: {
            type: Object
        },
        authToken: {
            type: Object
        },
        agency_id: {
            type: Schema.ObjectId,
            ref: 'Agency'
        },
        accountCustomFieldValue: {
            type: Number
        },
        contactCustomFieldValue: {
            type: Number
        },
        bpAgentMappingOn: {
            type: String  //bpAdministratorUserID, bpPrimaryContactUserID, bpPrimarySalesLeadUserID, bpPrimaryServiceLeadUserID are the possible values
        }
    },
    /**end BenefitPoint */
    // Nexsure >>>>>>>>>>>>>>>>>
    nexsureLoginCreds: {
        integrationKey: {
            type: String,
            trim: true
        },
        login: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            trim: true
        },
        nexsureEnv: {
            type: String,
            enum: ['test', 'prod']
        }
    },
    nexsureAccessTokenDetails: {
        type: Object
    },
    nexsureBranches: [{
        type: Object
    }],
    nexsureDepartments: [{
        type: Object
    }],
    nexsurePrimaryCarrierType: {
        type: String,
        enum: ["billing", "issuing"]
    },
    aggregatorName: String,
    isAggregator: {
        type: Boolean,
        default: false
    },
    dashboardId: String,
    // <<<<<<<<<<<<<<<<< Nexsure
    agentsToMap: {
        agentMappingForOtherAms: {} /**IM <> AMS sheet agent name mapping*/
    },
    customDataAccess: {
        type: Boolean,
        default: false
    },
    dataAccessType: {
        type: String, //glbranchcode, gldivisioncode, producer, agency, gldepartmentcode. glgroupcode are the possible values
        default: null
    },
    claimPolicyAutomation: { // claim automation settings
        isEnabled: {
            type: Boolean,
            required: true,
            default: false
        },
        isSharable: {
            type: Boolean,
            required: true,
            default: false
        },
        defaultClaimPolicyPipeline: {
            type: Schema.ObjectId,
            ref: 'Dealboardinfo'
        },
        defaultClaimPolicyStage: {
            type: Schema.ObjectId,
            ref: 'Dealboard'
        },
        isCustomisedBoardAndStage: {
            type: Boolean,
            default: false
        },
        CustomisedBoardAndStage: {
            personalPipeline: {
                type: Schema.ObjectId,
                ref: 'Dealboardinfo'
            },
            personalStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            commercialPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            commercialStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
            othersPipeline: {
                type: Schema.ObjectId,
                ref: "Dealboardinfo"
            },
            othersStage: {
                type: Schema.ObjectId,
                ref: 'Dealboard'
            },
        },
        agentsToMap: {
            policyAgent: {
                type: Boolean,
                default: false
            },
            executive: {
                type: Boolean,
                default: false
            },
            representative: {
                type: Boolean,
                default: false
            },
            assignTo: [{
                type: Schema.ObjectId,
                ref: 'Agents'
            }],
            agentMappingForOtherAms: {}
        },
    },
    twilio_configuration: {},
    incoming_call_configuration: {},
    // <== ContactUpdate Form
    communication_credits: {},
    /**it will restrict the access of app to policy holder for those agency which do not allow to see their data to their policy holder */
    appAccess: {
        type: Boolean,
        default: false
    },
    //aws unique folderId per agency
    awsUniqueFolderId: {
        type: String
    },
    rabbitMQCreds: { // store the rabbitMQCreds 
        notificationKey: {
            type: String
        }
    },
    ams360CustomPipelineContactAccountSyncSettings: { // used for the pipeline and stage based contact sync for ams360
        isEnabled: {
            type: Boolean,
            required: true,
            default: false
        },
        enabledOn: {
            type: Date
        },
        personalPipelineAndStageList: [
            {
                dealboardInfoPipelineId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboardinfo'
                },
                dealboardStageId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboard'
                },
                enabledTimestamp: {
                    type: Date
                }
            }
        ],
        commercialPipelineAndStageList: [
            {
                dealboardInfoPipelineId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboardinfo'
                },
                dealboardStageId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboard'
                },
                enabledTimestamp: {
                    type: Date
                }
            }
        ],
        otherPipelineAndStageList: [
            {
                dealboardInfoPipelineId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboardinfo'
                },
                dealboardStageId: {
                    type: Schema.ObjectId,
                    ref: 'Dealboard'
                },
                enabledTimestamp: {
                    type: Date
                }
            }
        ],
    },
    esignature_setting: {
        reminder: Boolean,
        trigger: Number,
        repeat: Boolean,
        redirect_url: String
    },
    confie_setting: {
        trigger: Number,
        enable: {
            type: Boolean,
            default: false
        }
    },
    systemIdleSetting: {
        "enable": {
            type: Boolean,
            default: false
        }, "time": String
    },

    lostClientXDate: {
        enabled: {
            type: Boolean,
            default: false
        },
        target: {
            type: String,
            enum: ["contact", "account"],
            default: "account"
        },
    },
    cancelPoliciesXDate: {
        type: Boolean,
        default: false
    },
    pipeline_setting: {},
    ascendCreds: {},//ascend integration creds
    mailServerType: { // Store all possible values of mailserver types. Based on this parameter email campaigns will be sent
        type: String,
        enum: ["aws", "sendgrid"],
        default: "aws"
    },
    sesVerifiedDomain: {
        type: Boolean,
        default: false
    },
    sgVerifiedDomain: {
        type: Boolean,
        default: false
    },
    evoAuthObject: {
        type: Object,
    },
    epicApiCreds: {
        type: Object,
    },
    evoAgencyId: { type: String },
    sesVerifiedDomainName: [],
    sgVerifiedDomainName: [],
    sagittaDumpDetails: {
        type: Object
    },
    sioaApiTokens: {
        type: Object
    },
    goal_wise: String,
    LookALikeCronStatus: {
        type: String,
        enum: ["Running", "Error", "Complete"]
    },
    LookALikeEnabled: {
        type: Boolean,
        default: false
    },
    QQCustomDataSync: Object,
    lalm_log: Object,
    default_unsubscribe: {
        account: {
            email_marketing: {
                type: Boolean,
                default: false
            },
            email_transactional: {
                type: Boolean,
                default: false
            },
            text: {
                type: Boolean,
                default: false
            }
        },
        contact: {
            email_marketing: {
                type: Boolean,
                default: false
            },
            email_transactional: {
                type: Boolean,
                default: false
            },
            text: {
                type: Boolean,
                default: false
            }
        },
    },
    LookALikeStatusUpdatedAt: {
        type: Date
    },
    DealPredictionCronStatus: {
        type: String
    },
    DealPredictionStatusUpdatedAt: {
        type: Date
    },

    /** epic : dn */
    epic_data_sync_tracker: Object,
    epic_creds: Object,
    epic_branch_guuids: Array,
    epic_branches: Array,
    is_branched_agency: Boolean,
    onboarding_status: {
        type: String,
    },
    onboarding_completed_at: {
        type: Date
    },
}, {
    timestamps: true
});

export const agencies_collection = primary_connection.model('Agency', AgencySchema);

