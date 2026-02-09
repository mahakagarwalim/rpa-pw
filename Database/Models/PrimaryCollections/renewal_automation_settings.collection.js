'use strict';
import mongoose, { Schema } from 'mongoose';
import { PrimaryConnection } from "../../Config.js";

const RenewalAutomationSettingsSchema = new mongoose.Schema({
    agency_id: {
        type: Schema.ObjectId,
        ref: 'Agency',
        required: true,
    },
    isRenewalAutomationEnabled: {
        type: Boolean,
        required: true,
        default: false
    },
    createOneCardPerUser: {
        type: Boolean,
        required: true,
        default: false
    },
    RestrictRevisedPolicies: {
        type: Boolean,
        default: false
    },
    createCardsForEntireRange: {
        type: Boolean,
        default: false
    },
    archiveCardsOnExpiration: {
        type: Boolean,
        required: true,
        default: false
    },
    dayToArchiveCardsOnExpiration: {
        type: Number
    },
    isCustomDueDate: {
        type: Boolean,
        required: true,
        default: false
    },
    dueDateFromPolicyExpiration: {
        type: Number
    },
    daysToCheckForMorePoliciesInTheAccount: {
        type: Number
    },
    automationBasedOn: {
        type: String,
        required: true,
        enum: ["default", "policytype", "category", "department", "branch", "division"],
        default: "default"
    },
    RaterSyncSettings: {
        IsEnabled: Boolean,
        NumberOfDays: {
            type: Number,
            default: 0
        },
    },
    QPS_Settings: {
        IsEnabled: Boolean,
    },
    skipCardCreationOnWeekends: Boolean,
    restrictCategories: [{
        type: Schema.ObjectId,
        ref: "Categories"
    }],
    restrictProfitCenters: [],
    defaultSettings: [{
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        epicServicingRoles: String,
        epicSercivingRoleFailureAssignHouseAccount: {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
        },
        customAgentForRenewalAutomation: {
            type: Schema.ObjectId,
            ref: 'Agents'
        },
        isSharable: {
            type: Boolean,
            default: false
        },
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        }
    }],
    policyTypeSettings: [{
        isDisabled: {
            type: Boolean,
            default: false
        },
        policyType: {
            type: String,
            enum: [
                "personal", "commercial", "others",
                "nonPropertyAndCasuality", "benefits", "life", "health",
                "financialServices", "bonds", "administrative",
                "lifeAndHealth","agriculture",
            ],
            default: "personal"
        },
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        epicServicingRoles: String,
        epicSercivingRoleFailureAssignHouseAccount: {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
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
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        },
        customBranches: Array
    }],
    categorySettings: [{
        category: {
            type: Schema.ObjectId,
            ref: 'Categories'
        },
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        epicServicingRoles: String,
        epicSercivingRoleFailureAssignHouseAccount: {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
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
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        }
    }],
    departmentSettings: [{
        department: {
            type: String
        },
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        epicServicingRoles: String,
        epicSercivingRoleFailureAssignHouseAccount: {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
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
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        }
    }],
    branchSettings: [{
        branchId: {
            type: String
        },
        branchName: {
            type: String
        },
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        epicServicingRoles: String,
        epicSercivingRoleFailureAssignHouseAccount: {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
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
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        }
    }],
    divisionSettings: [{
        divisionId: {
            type: String
        },
        divisionName: {
            type: String
        },
        daysForRenewalAutomation: {
            type: Number,
            default: 60
        },
        assignAgent: {
            type: String,
            enum: [
                "policyAgent",
                "customAgent",
                "executive",
                "representative",
                "execAndRep",
                "account-executive",
                "account-representative",
                "account-execAndRep",
                "hs-csr",
                "hs-agent1",
                "hs-agent2",
                "hs-agent3",
                "csr",
                "policy-csr",
                "none",
                "retension-sepcialist",
                "epic-servicing-role"
            ],
            default: "policyAgent"
        },
        "epicServicingRoles": String,
        "epicSercivingRoleFailureAssignHouseAccount": {
            type: Boolean,
            default: false
        },
        primaryAgent: {
            type: String,
            enum: ["executive", "representative"],
            default: "executive"
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
        createCardForPoliciesWithPremiumAbove: {
            type: Number,
            default: 0
        }
    }],
    isRenewalUpdatedOnSamePolicy: {
        // If the Renewal is happening in same policy
        // ie.., Effective and Expiration date is updated on the same policy
        type: Boolean,
        default: false
    },
    "updatedBy": { type: Schema.ObjectId, ref: "Agents" },
    "createdBy": { type: Schema.ObjectId, ref: "Agents" },
}, {
    timestamps: true
});

export const renewal_automation_settings_collection = PrimaryConnection.model('RenewalAutomationSettings', RenewalAutomationSettingsSchema);