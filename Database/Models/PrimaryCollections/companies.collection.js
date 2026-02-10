'use strict';

import mongoose, { Schema } from 'mongoose';
import { PrimaryConnection } from '../../Config.js';

const companies_schema = new mongoose.Schema({
    company_name: {
        type: String,
        required:true
    },
    alias: {
        type: String,
        default: null
    },
    company_code: {
        type: String,
    },
    company_img: {
        type: String,
    },
    company_website: {
        type: String,
    },
    company_status: {
        type: String,
    },
    customer_service: {
        type: String,
    },
    company_email : {
        type: String,
    },
    claim_website : {
        type : String
    },
    claim_email : {
        type : String
    },
    claim_service : {
        type : String
    },
    premium_website : {
        type : String
    },
    ams360CompanyCode : String,
    premium_email : {
        type : String
    },
    masterCompany : [{
        type: Schema.ObjectId,
        ref: 'Companie'
    }],
    merged_company_id: [{
        type: Schema.ObjectId,
        ref: 'Companie'
    }],// policy is related to which carrier(like travellers , state group etc)
    premium_service : {
        type : String
    },
    coverages : [],
    agency_id: {
        type: Schema.ObjectId,
        ref: 'Agency'
    },//(this company is related to which agency)
    categories: {
        type: Schema.ObjectId,
        ref: 'Categories'
    },
    allcategories: [{
        type: Schema.ObjectId,
        ref: 'Categories'
    }],
    company_about : {
        type : String
    },
    company_add_date: {
        type: Date,
        default: Date.now
    },
    company_array: [],
    updatedAt: {
        type: Date
    },
    createdAt : {
        type : Date ,
        default : Date.now
    },
    oldId :{
        type: Schema.ObjectId,
        ref: 'Companie'
    },
    archived : {
        type: Boolean,
        default : false
    },
    dataUpdatedOn: {
        type: Date
    },
    archivedAt : {
        type: Date
    },
    archivedBy : String,
    visibility : {
        type : Boolean,
        default :  true
    },
    visibiltyOffBy :  String,
    ams360ParentCompanyCode: { // store the ams360 parent company code
        type: String,
    },
    ams360ParentCompanyName: { // store the ams360 parent company name
        type: String,
    },
    ams360CompanyType: {
        type: String, // based on this the type of company will be identified. B-Brokerage, W-Writing, N-Parent, S-Subscription
    },
    ams360ShortName: {
        type: String,
    },
    ams360Inactive: { // if this is true then this compant is archived in ams360
        type: Boolean,
        default: false
    },
    srMasterCarrierId: { // Merged with the securerisk master carrier id. Its independent parameter to merge the carriers for SR level
        type: Schema.ObjectId,
        ref: 'Companie'
    },
    isFromSecureRisk: {
        type: Boolean
    },
    srPartnerCarrier: {
        type: Boolean // parameter used to say whether the carrier is securerisk partner carrier or not
    },
    srMasterCarrier: {
        type: Boolean // parameter used to say whether the carrier is securerisk master carrier or not
    },
    epicCompanyId: { // epic company Id unique
        type: Number
    },
    epicCompanyGuid: {
        type: String
    },
    epicCompanyLookUpCode: { // epic company lookup code unique
        type: String
    },
    epicCompanyTypeCode: {
        type: String
    },
    company_goal : String, /**Annual Goal specified by each agency for particular carrier.  */
    company_commission : Number, /**Commission percentage on each policy. */
    /**BenefitPoint Carrier ID */
    bpCompanyID: {
        type: Number
    },
    amsSource: {
        type: String
    },
    nexsureCarrierId: {
        type: Number
    },
    nexsureCarrierNameId: {
        type: Number
    },
    nexsureBillingCarrier: {
        type: Boolean 
    },
    nexsureIssuingCarrier: {
        type: Boolean 
    },
    notes : String,
    files : [],
    // sagitta carrier code
    sagittaInsurerCd: {
        type: String
    },
    //sagitta carrier id
    sagittaCarrierId: {
        type: String
    },
      /** From here EVO parameter will be added */
  evoCompanyId:  {
    type: String
  },
  evoWritingCompanyId:  {
    type: String
  },
  evoCompanyname: { // store the ams360 parent company code
    type: String,
  },
  evoCompanyType: {
    type: String, // based on this the type of company will be identified. B-Brokerage, W-Writing, N-Parent, S-Subscription
  },
  evoAlphaName: {
    type: String,
  },
  evoCompanyEmail: {
    type: String, // based on this the type of company will be identified. B-Brokerage, W-Writing, N-Parent, S-Subscription
  },
   /** From here EVO parameter will be added */
   
    /** From here EPIC parameter will be added */ 

    epicCompanyCodeV2: {
        type: String
    },
    epicCompanyIdV2: {
        type: String
    },
    epicCompanyname:{
        type: String
    },

   /** From here EPIC parameter will be stopped */ 
    agent_login_website: String,

    isCustomCompany: {
        type: Boolean,
        default: false
    },
    goals : {},

    isEpicV2Ico: {
        type: Boolean
    },

    isEpicV2Ppc: {
        type: Boolean
    },

    epicV2PpcType: {
        type: Array
    },
    xanatekCarrierId: {
        type: String
    },
    isInActiveInAMS: { // if this is true then this company is archived in EPIC
        type: Boolean,
        default: false
    }
},{
    timestamps: {
      createdAt: true,
      updatedAt: true
    }
  });

export const companies_collection = PrimaryConnection.model('Companie', companies_schema);